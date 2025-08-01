import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

export enum MessageRoleEntity {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM',
}

export enum ConversationStatusEntity {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
}

@Entity('ai_conversations')
export class AiConversationEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 36 })
  userId: string;

  @Column('varchar', { length: 200, nullable: true })
  title?: string;

  @Column({
    type: 'enum',
    enum: ConversationStatusEntity,
    default: ConversationStatusEntity.ACTIVE,
  })
  status: ConversationStatusEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;
}

@Entity('ai_messages')
export class AiMessageEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 36 })
  conversationId: string;

  @Column({
    type: 'enum',
    enum: MessageRoleEntity,
  })
  role: MessageRoleEntity;

  @Column('text')
  content: string;

  @Column('json', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => AiConversationEntity)
  @JoinColumn({ name: 'conversationId' })
  conversation: AiConversationEntity;
}
