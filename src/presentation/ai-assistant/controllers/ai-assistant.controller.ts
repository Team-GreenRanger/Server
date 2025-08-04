import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  UseGuards,
  Request,
  Param,
  Query,
  NotFoundException,
  Inject
} from '@nestjs/common';
import type { IConversationRepository, IMessageRepository } from '../../../domain/ai-assistant/repositories/ai-assistant.repository.interface';
import { CONVERSATION_REPOSITORY, MESSAGE_REPOSITORY } from '../../../domain/ai-assistant/repositories/ai-assistant.repository.interface';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ChatWithAIUseCase } from '../../../application/ai-assistant/use-cases/chat-with-ai.use-case';
import { VerifyImageWithAIUseCase } from '../../../application/ai-assistant/use-cases/verify-image-with-ai.use-case';
import { GetConversationsUseCase } from '../../../application/ai-assistant/use-cases/get-conversations.use-case';
import { GeminiService } from '../../../infrastructure/external-apis/gemini/gemini.service';
import { ClaudeService } from '../../../infrastructure/external-apis/claude/claude.service';
import { 
  ChatWithAIDto,
  ChatWithAIResponseDto,
  VerifyImageDto,
  ImageVerificationResponseDto,
  GenerateEcoTipResponseDto,
  ConversationListResponseDto,
  EcoEducationContentDto,
  EcoEducationContentResponseDto
} from '../../../application/ai-assistant/dto/ai-assistant.dto';

@ApiTags('AI Assistant')
@Controller('ai')
export class AIAssistantController {
  constructor(
    private readonly chatWithAIUseCase: ChatWithAIUseCase,
    private readonly verifyImageWithAIUseCase: VerifyImageWithAIUseCase,
    private readonly getConversationsUseCase: GetConversationsUseCase,
    private readonly geminiService: GeminiService,
    private readonly claudeService: ClaudeService,
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversationRepository: IConversationRepository,
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: IMessageRepository,
  ) {}

  @Post('chat')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Chat with AI assistant' })
  @ApiResponse({ 
    status: 200, 
    description: 'AI assistant response', 
    type: ChatWithAIResponseDto 
  })
  async chatWithAI(
    @Request() req: any,
    @Body() chatDto: ChatWithAIDto,
  ): Promise<ChatWithAIResponseDto> {
    const userId = req.user.sub;
    
    const result = await this.chatWithAIUseCase.execute({
      userId,
      message: chatDto.message,
      conversationId: chatDto.conversationId,
    });

    return {
      response: result.response,
      conversationId: result.conversationId,
      messageId: result.messageId,
      timestamp: result.timestamp,
    };
  }

  @Post('verify-image')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify mission image with AI' })
  @ApiResponse({ 
    status: 200, 
    description: 'Image verification result', 
    type: ImageVerificationResponseDto 
  })
  async verifyImage(
    @Request() req: any,
    @Body() verifyImageDto: VerifyImageDto,
  ): Promise<ImageVerificationResponseDto> {
    const userId = req.user.sub;
    
    const result = await this.verifyImageWithAIUseCase.execute({
      userId,
      imageUrl: verifyImageDto.imageUrl,
      missionId: verifyImageDto.missionId,
    });

    return {
      isValid: result.isValid,
      confidence: result.confidence,
      reasoning: result.reasoning,
      detectedElements: result.detectedElements,
      suggestions: result.suggestions,
      verificationId: result.verificationId,
      timestamp: result.timestamp,
    };
  }

  @Get('eco-tip')
  @ApiOperation({ summary: 'Generate daily eco tip' })
  @ApiResponse({ 
    status: 200, 
    description: 'Generated eco tip', 
    type: GenerateEcoTipResponseDto 
  })
  async generateEcoTip(): Promise<GenerateEcoTipResponseDto> {
    const tip = await this.geminiService.generateEcoTip();
    
    return {
      tip,
      category: 'daily_tip',
      timestamp: new Date(),
    };
  }

  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user conversation history' })
  @ApiResponse({ 
    status: 200, 
    description: 'User conversations', 
    type: ConversationListResponseDto 
  })
  async getConversations(@Request() req: any): Promise<ConversationListResponseDto> {
    const userId = req.user.sub;
    
    const result = await this.getConversationsUseCase.execute({ userId });
    
    return {
      conversations: result.conversations,
      total: result.total,
    };
  }

  @Get('conversations/:conversationId/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get messages in a conversation' })
  @ApiResponse({ 
    status: 200, 
    description: 'Conversation messages' 
  })
  async getConversationMessages(
    @Request() req: any,
    @Param('conversationId') conversationId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const userId = req.user.sub;
    
    // 사용자 권한 확인
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundException('Conversation not found');
    }
    
    const result = await this.messageRepository.findByConversationId(
      conversationId,
      limit || 50,
      offset || 0
    );
    
    return {
      messages: result.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
      })),
      total: result.total,
      hasNext: (offset || 0) + (limit || 50) < result.total,
    };
  }

  @Post('education-content')
  @ApiOperation({ summary: 'Generate educational content about environmental topics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Generated educational content', 
    type: EcoEducationContentResponseDto 
  })
  async generateEducationContent(
    @Body() contentDto: EcoEducationContentDto,
  ): Promise<EcoEducationContentResponseDto> {
    const content = await this.claudeService.generateEcoEducationContent(contentDto.topic);
    
    return {
      content,
      topic: contentDto.topic,
      wordCount: content.split(' ').length,
      timestamp: new Date(),
    };
  }
}
