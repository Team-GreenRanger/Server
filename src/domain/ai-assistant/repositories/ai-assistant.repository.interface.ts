import { Conversation, ConversationStatus } from '../entities/conversation.entity';
import { Message, MessageRole } from '../entities/message.entity';

export interface IConversationRepository {
  save(conversation: Conversation): Promise<Conversation>;
  findById(id: string): Promise<Conversation | null>;
  findByUserId(userId: string, limit?: number, offset?: number): Promise<{
    conversations: Conversation[];
    total: number;
  }>;
  findByUserIdAndStatus(userId: string, status: ConversationStatus): Promise<Conversation[]>;
  update(id: string, conversation: Partial<Conversation>): Promise<Conversation>;
  delete(id: string): Promise<void>;
  getConversationWithLastMessage(userId: string, limit?: number, offset?: number): Promise<{
    conversations: Array<{
      conversation: Conversation;
      lastMessage?: Message;
      messageCount: number;
    }>;
    total: number;
  }>;
}

export interface IMessageRepository {
  save(message: Message): Promise<Message>;
  findById(id: string): Promise<Message | null>;
  findByConversationId(conversationId: string, limit?: number, offset?: number): Promise<{
    messages: Message[];
    total: number;
  }>;
  findByConversationIdAndRole(conversationId: string, role: MessageRole): Promise<Message[]>;
  findLastMessageByConversationId(conversationId: string): Promise<Message | null>;
  countByConversationId(conversationId: string): Promise<number>;
  delete(id: string): Promise<void>;
  deleteByConversationId(conversationId: string): Promise<void>;
}

export const CONVERSATION_REPOSITORY = Symbol('CONVERSATION_REPOSITORY');
export const MESSAGE_REPOSITORY = Symbol('MESSAGE_REPOSITORY');
