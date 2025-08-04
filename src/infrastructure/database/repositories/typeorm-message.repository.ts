import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageRole } from '../../../domain/ai-assistant/entities/message.entity';
import { IMessageRepository } from '../../../domain/ai-assistant/repositories/ai-assistant.repository.interface';
import { AiMessageEntity } from '../entities/ai-conversation.entity';

@Injectable()
export class TypeOrmMessageRepository implements IMessageRepository {
  constructor(
    @InjectRepository(AiMessageEntity)
    private readonly messageRepository: Repository<AiMessageEntity>,
  ) {}

  async save(message: Message): Promise<Message> {
    const messageEntity = this.toEntity(message);
    const savedEntity = await this.messageRepository.save(messageEntity);
    return this.toDomain(savedEntity);
  }

  async findById(id: string): Promise<Message | null> {
    const entity = await this.messageRepository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByConversationId(conversationId: string, limit = 50, offset = 0): Promise<{
    messages: Message[];
    total: number;
  }> {
    const [entities, total] = await this.messageRepository.findAndCount({
      where: { conversationId },
      order: { createdAt: 'ASC' },
      take: limit,
      skip: offset,
    });

    return {
      messages: entities.map(entity => this.toDomain(entity)),
      total,
    };
  }

  async findByConversationIdAndRole(conversationId: string, role: MessageRole): Promise<Message[]> {
    const entities = await this.messageRepository.find({
      where: { conversationId, role },
      order: { createdAt: 'ASC' },
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async findLastMessageByConversationId(conversationId: string): Promise<Message | null> {
    const entity = await this.messageRepository.findOne({
      where: { conversationId },
      order: { createdAt: 'DESC' },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async countByConversationId(conversationId: string): Promise<number> {
    return await this.messageRepository.count({ where: { conversationId } });
  }

  async delete(id: string): Promise<void> {
    await this.messageRepository.delete(id);
  }

  async deleteByConversationId(conversationId: string): Promise<void> {
    await this.messageRepository.delete({ conversationId });
  }

  private toEntity(message: Message): AiMessageEntity {
    const entity = new AiMessageEntity();
    entity.id = message.id;
    entity.conversationId = message.conversationId;
    entity.role = message.role;
    entity.content = message.content;
    entity.metadata = message.metadata;
    entity.createdAt = message.createdAt;
    return entity;
  }

  private toDomain(entity: AiMessageEntity): Message {
    return Message.reconstitute({
      id: entity.id,
      conversationId: entity.conversationId,
      role: entity.role,
      content: entity.content,
      metadata: entity.metadata,
      createdAt: entity.createdAt,
    });
  }
}
