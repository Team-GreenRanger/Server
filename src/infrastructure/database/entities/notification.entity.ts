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

export enum NotificationTypeEntity {
  MISSION_ASSIGNED = 'MISSION_ASSIGNED',
  MISSION_COMPLETED = 'MISSION_COMPLETED',
  MISSION_VERIFIED = 'MISSION_VERIFIED',
  MISSION_REJECTED = 'MISSION_REJECTED',
  CREDIT_EARNED = 'CREDIT_EARNED',
  REWARD_PURCHASED = 'REWARD_PURCHASED',
  REWARD_EXPIRING = 'REWARD_EXPIRING',
  RANKING_UPDATE = 'RANKING_UPDATE',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
}

@Entity('notifications')
export class NotificationEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 36 })
  userId: string;

  @Column({
    type: 'enum',
    enum: NotificationTypeEntity,
  })
  type: NotificationTypeEntity;

  @Column('varchar', { length: 200 })
  title: string;

  @Column('text')
  message: string;

  @Column('json', { nullable: true })
  data?: Record<string, any>;

  @Column('boolean', { default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;
}
