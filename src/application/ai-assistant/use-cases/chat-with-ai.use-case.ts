import { Injectable } from '@nestjs/common';
import { GeminiService } from '../../../infrastructure/external-apis/gemini/gemini.service';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatWithAICommand {
  userId: string;
  message: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
  }>;
}

export interface ChatWithAIResult {
  response: string;
  conversationId?: string;
  messageId: string;
  timestamp: Date;
}

@Injectable()
export class ChatWithAIUseCase {
  constructor(
    private readonly geminiService: GeminiService,
  ) {}

  async execute(command: ChatWithAICommand): Promise<ChatWithAIResult> {
    // Build conversation context
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: this.getSystemPrompt(),
      },
    ];

    // Add conversation history if provided
    if (command.conversationHistory && command.conversationHistory.length > 0) {
      const recentHistory = command.conversationHistory.slice(-10); // Keep last 10 messages
      for (const historyMessage of recentHistory) {
        messages.push({
          role: historyMessage.role,
          content: historyMessage.content,
        });
      }
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: command.message,
    });

    try {
      const response = await this.geminiService.createChatCompletion({
        messages,
        temperature: 0.7,
        maxTokens: 500,
      });

      return {
        response: response.message,
        messageId: this.generateMessageId(),
        timestamp: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to get AI response: ${error.message}`);
    }
  }

  private getSystemPrompt(): string {
    return `You are EcoLife AI, a helpful environmental and sustainability assistant for the EcoLife mobile app. 

Your role is to:
- Help users understand climate change and environmental issues
- Provide practical eco-friendly tips and advice
- Motivate users to complete environmental missions
- Answer questions about carbon credits and sustainability
- Explain how individual actions contribute to climate action
- Provide guidance on eco-friendly lifestyle changes

Guidelines:
- Be encouraging and motivational
- Provide actionable advice
- Use simple, accessible language
- Focus on positive impact
- Reference scientific facts when relevant
- Keep responses concise but informative (under 300 words)
- Relate advice to the app's mission system when appropriate

Remember: You're helping users become more environmentally conscious through the EcoLife platform.`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
