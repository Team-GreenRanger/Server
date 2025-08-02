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
import { UserRewardStatus } from '../../../domain/reward/entities/reward.entity';

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
    enum: UserRewardStatus,
    default: UserRewardStatus.PURCHASED,
  })
  status: UserRewardStatus;

  @CreateDateColumn()
  purchasedAt: Date;

  @Column('datetime')
  expiresAt: Date;

  @Column('datetime', { nullable: true })
  usedAt?: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.userRewards)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ManyToOne(() => RewardEntity, (reward) => reward.userRewards)
  @JoinColumn({ name: 'rewardId' })
  reward: RewardEntity;
}
