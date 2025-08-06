import { Injectable, Inject } from '@nestjs/common';
import { GeminiService } from '../../../infrastructure/external-apis/gemini/gemini.service';
import type { IConversationRepository, IMessageRepository } from '../../../domain/ai-assistant/repositories/ai-assistant.repository.interface';
import { CONVERSATION_REPOSITORY, MESSAGE_REPOSITORY } from '../../../domain/ai-assistant/repositories/ai-assistant.repository.interface';
import { Conversation, ConversationStatus } from '../../../domain/ai-assistant/entities/conversation.entity';
import { Message, MessageRole } from '../../../domain/ai-assistant/entities/message.entity';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatWithAICommand {
  userId: string;
  message: string;
  conversationId?: string;
}

export interface ChatWithAIResult {
  response: string;
  conversationId: string;
  messageId: string;
  timestamp: Date;
}

@Injectable()
export class ChatWithAIUseCase {
  constructor(
    private readonly geminiService: GeminiService,
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversationRepository: IConversationRepository,
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: IMessageRepository,
  ) {}

  async execute(command: ChatWithAICommand): Promise<ChatWithAIResult> {
    // 1. 대화 찾기 또는 새로 생성
    let conversation: Conversation;
    
    if (command.conversationId) {
      const existingConversation = await this.conversationRepository.findById(command.conversationId);
      if (existingConversation && existingConversation.userId === command.userId) {
        conversation = existingConversation;
      } else {
        throw new Error('Conversation not found or access denied');
      }
    } else {
      // 새 대화 생성
      conversation = Conversation.create({
        userId: command.userId,
        title: this.generateConversationTitle(command.message),
      });
      conversation = await this.conversationRepository.save(conversation);
    }

    // 2. 사용자 메시지 저장
    const userMessage = Message.create({
      conversationId: conversation.id,
      role: MessageRole.USER,
      content: command.message,
    });
    await this.messageRepository.save(userMessage);

    // 3. 이전 메시지들 조회 (컨텍스트)
    const messageHistory = await this.messageRepository.findByConversationId(
      conversation.id,
      20 // 최근 20개 메시지
    );

    // 4. AI 응답 생성
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: this.getSystemPrompt(),
      },
    ];

    // 최근 메시지들을 컨텍스트로 추가 (사용자 메시지 제외하고 이전 것들만)
    const recentMessages = messageHistory.messages
      .filter(msg => msg.id !== userMessage.id)
      .slice(-10); // 최근 10개
      
    for (const historyMessage of recentMessages) {
      messages.push({
        role: historyMessage.role === MessageRole.USER ? 'user' : 'assistant',
        content: historyMessage.content,
      });
    }

    // 현재 사용자 메시지 추가
    messages.push({
      role: 'user',
      content: command.message,
    });

    try {
      const response = await this.geminiService.createChatCompletion({
        messages,
        temperature: 0.7,
        maxTokens: 300,
      });

      // 5. AI 응답 저장
      const aiMessage = Message.create({
        conversationId: conversation.id,
        role: MessageRole.ASSISTANT,
        content: response.message,
      });
      const savedAiMessage = await this.messageRepository.save(aiMessage);

      return {
        response: response.message,
        conversationId: conversation.id,
        messageId: savedAiMessage.id,
        timestamp: savedAiMessage.createdAt,
      };
    } catch (error) {
      throw new Error(`Failed to get AI response: ${error.message}`);
    }
  }

  private generateConversationTitle(firstMessage: string): string {
    // 첫 메시지에서 간단한 제목 생성
    const words = firstMessage.split(' ').slice(0, 4).join(' ');
    return words.length > 30 ? words.substring(0, 30) + '...' : words;
  }

  private getSystemPrompt(): string {
    return `You are EcoLife AI, an environmental assistant for the EcoLife app.

Your role:
- Help with climate change and environmental questions
- Give practical eco-friendly tips
- Answer questions about carbon credits and sustainability
- Motivate users to complete environmental missions

Response guidelines:
- Keep responses under 100 words
- Be direct and helpful
- Focus on actionable advice
- Use simple language
- Include specific numbers when relevant

Format:
- Use short paragraphs
- Use bullet points for lists (•)
- Avoid excessive formatting

Example: "Switch to LED bulbs to save 75% energy. Unplug devices when not in use. This reduces your electricity bill by $10-15 monthly."

Be concise and practical.`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
