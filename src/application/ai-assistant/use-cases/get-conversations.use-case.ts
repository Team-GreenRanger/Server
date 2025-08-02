import { Injectable, Inject } from '@nestjs/common';

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
  constructor() {}

  async execute(request: GetConversationsRequest): Promise<GetConversationsResponse> {
    const { userId, limit = 10, offset = 0 } = request;

    // TODO: In production, this would query conversation history from database
    // For now, returning empty conversations as conversations are not persisted yet
    
    return {
      conversations: [],
      total: 0,
      hasNext: false,
    };
  }
}