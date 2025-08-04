import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserRewardEntity } from './user-reward.entity';
import { RewardType, RewardStatus } from '../../../domain/reward/entities/reward.entity';

@Entity('tbl_rewards')
export class RewardEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 200 })
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: RewardType,
  })
  type: RewardType;

  @Column('int')
  creditCost: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  originalPrice?: number;

  @Column('varchar', { length: 500, nullable: true })
  imageUrl?: string;

  @Column('varchar', { length: 500 })
  barcodeImageUrl: string;

  @Column('varchar', { length: 100, nullable: true })
  partnerName?: string;

  @Column('varchar', { length: 500, nullable: true })
  partnerLogoUrl?: string;

  @Column('json', { nullable: true })
  termsAndConditions: string[];

  @Column('int', { default: 30 })
  validityDays: number;

  @Column('int', { nullable: true })
  totalQuantity?: number;

  @Column('int', { nullable: true })
  remainingQuantity?: number;

  @Column({
    type: 'enum',
    enum: RewardStatus,
    default: RewardStatus.ACTIVE,
  })
  status: RewardStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => UserRewardEntity, (userReward) => userReward.reward)
  userRewards: UserRewardEntity[];
}
