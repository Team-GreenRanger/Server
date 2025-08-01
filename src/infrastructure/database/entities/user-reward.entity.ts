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
import { RewardEntity } from './reward.entity';

export enum UserRewardStatusEntity {
  PURCHASED = 'PURCHASED',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
  REFUNDED = 'REFUNDED',
}

@Entity('user_rewards')
export class UserRewardEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 36 })
  userId: string;

  @Column('varchar', { length: 36 })
  rewardId: string;

  @Column('varchar', { length: 36 })
  transactionId: string;

  @Column('varchar', { length: 100, nullable: true })
  couponCode?: string;

  @Column({
    type: 'enum',
    enum: UserRewardStatusEntity,
    default: UserRewardStatusEntity.PURCHASED,
  })
  status: UserRewardStatusEntity;

  @CreateDateColumn()
  purchasedAt: Date;

  @Column('datetime')
  expiresAt: Date;

  @Column('datetime', { nullable: true })
  usedAt?: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => UserEntity, (user) => user.userRewards)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ManyToOne(() => RewardEntity, (reward) => reward.userRewards)
  @JoinColumn({ name: 'rewardId' })
  reward: RewardEntity;
}
