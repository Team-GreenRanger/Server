import { Injectable, Inject } from '@nestjs/common';
import type { IConversationRepository, IMessageRepository } from '../../../domain/ai-assistant/repositories/ai-assistant.repository.interface';
import { CONVERSATION_REPOSITORY, MESSAGE_REPOSITORY } from '../../../domain/ai-assistant/repositories/ai-assistant.repository.interface';
import { ConversationStatus } from '../../../domain/ai-assistant/entities/conversation.entity';

export interface GetConversationsRequest {
  userId: string;
  limit?: number;
  offset?: number;
}

export interface ConversationItem {
  id: string;
  userId: string;
  title?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: string;
  lastMessageAt?: Date;
  messageCount?: number;
}

export interface GetConversationsResponse {
  conversations: ConversationItem[];
  total: number;
  hasNext: boolean;
}

@Injectable()
export class GetConversationsUseCase {
  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversationRepository: IConversationRepository,
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: IMessageRepository,
  ) {}

  async execute(request: GetConversationsRequest): Promise<GetConversationsResponse> {
    const { userId, limit = 10, offset = 0 } = request;

    const result = await this.conversationRepository.getConversationWithLastMessage(
      userId,
      limit,
      offset
    );

    const conversations: ConversationItem[] = [];
    
    for (const item of result.conversations) {
      const lastMessage = await this.messageRepository.findLastMessageByConversationId(item.conversation.id);
      const messageCount = await this.messageRepository.countByConversationId(item.conversation.id);
      
      conversations.push({
        id: item.conversation.id,
        userId: item.conversation.userId,
        title: item.conversation.title,
        status: item.conversation.status,
        createdAt: item.conversation.createdAt,
        updatedAt: item.conversation.updatedAt,
        lastMessage: lastMessage?.content,
        lastMessageAt: lastMessage?.createdAt,
        messageCount,
      });
    }
    
    return {
      conversations,
      total: result.total,
      hasNext: offset + limit < result.total,
    };
  }
}