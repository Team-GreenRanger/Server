import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation, ConversationStatus } from '../../../domain/ai-assistant/entities/conversation.entity';
import { Message, MessageRole } from '../../../domain/ai-assistant/entities/message.entity';
import { IConversationRepository } from '../../../domain/ai-assistant/repositories/ai-assistant.repository.interface';
import { AiConversationEntity } from '../entities/ai-conversation.entity';

@Injectable()
export class TypeOrmConversationRepository implements IConversationRepository {
  constructor(
    @InjectRepository(AiConversationEntity)
    private readonly conversationRepository: Repository<AiConversationEntity>,
  ) {}

  async save(conversation: Conversation): Promise<Conversation> {
    const conversationEntity = this.toEntity(conversation);
    const savedEntity = await this.conversationRepository.save(conversationEntity);
    return this.toDomain(savedEntity);
  }

  async findById(id: string): Promise<Conversation | null> {
    const entity = await this.conversationRepository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByUserId(userId: string, limit = 10, offset = 0): Promise<{
    conversations: Conversation[];
    total: number;
  }> {
    const [entities, total] = await this.conversationRepository.findAndCount({
      where: { userId, status: ConversationStatus.ACTIVE },
      order: { updatedAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      conversations: entities.map(entity => this.toDomain(entity)),
      total,
    };
  }

  async findByUserIdAndStatus(userId: string, status: ConversationStatus): Promise<Conversation[]> {
    const entities = await this.conversationRepository.find({
      where: { userId, status },
      order: { updatedAt: 'DESC' },
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async update(id: string, updateData: Partial<Conversation>): Promise<Conversation> {
    const entityUpdate: Partial<AiConversationEntity> = {};
    
    if (updateData.title !== undefined) {
      entityUpdate.title = updateData.title;
    }
    if (updateData.status) {
      entityUpdate.status = updateData.status;
    }
    
    await this.conversationRepository.update(id, entityUpdate);
    const updatedEntity = await this.conversationRepository.findOne({ where: { id } });
    if (!updatedEntity) {
      throw new Error('Conversation not found after update');
    }
    return this.toDomain(updatedEntity);
  }

  async delete(id: string): Promise<void> {
    await this.conversationRepository.update(id, { status: ConversationStatus.DELETED });
  }

  async getConversationWithLastMessage(userId: string, limit = 10, offset = 0): Promise<{
    conversations: Array<{
      conversation: Conversation;
      lastMessage?: Message;
      messageCount: number;
    }>;
    total: number;
  }> {
    const [entities, total] = await this.conversationRepository.findAndCount({
      where: { userId, status: ConversationStatus.ACTIVE },
      order: { updatedAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    const result: Array<{
      conversation: Conversation;
      lastMessage?: Message;
      messageCount: number;
    }> = [];
    
    for (const entity of entities) {
      const conversation = this.toDomain(entity);
      
      // 마지막 메시지와 메시지 수를 별도로 조회 (실제로는 Message Repository 필요)
      // 현재는 기본값으로 설정
      result.push({
        conversation,
        lastMessage: undefined,
        messageCount: 0,
      });
    }

    return {
      conversations: result,
      total,
    };
  }

  private toEntity(conversation: Conversation): AiConversationEntity {
    const entity = new AiConversationEntity();
    entity.id = conversation.id;
    entity.userId = conversation.userId;
    entity.title = conversation.title;
    entity.status = conversation.status;
    entity.createdAt = conversation.createdAt;
    entity.updatedAt = conversation.updatedAt;
    return entity;
  }

  private toDomain(entity: AiConversationEntity): Conversation {
    return Conversation.reconstitute({
      id: entity.id,
      userId: entity.userId,
      title: entity.title,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
