import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserRewardEntity } from './user-reward.entity';

export enum RewardTypeEntity {
  DISCOUNT_COUPON = 'DISCOUNT_COUPON',
  GIFT_CARD = 'GIFT_CARD',
  PHYSICAL_ITEM = 'PHYSICAL_ITEM',
  EXPERIENCE = 'EXPERIENCE',
}

export enum RewardStatusEntity {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}

@Entity('rewards')
export class RewardEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 200 })
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: RewardTypeEntity,
  })
  type: RewardTypeEntity;

  @Column('int')
  creditCost: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  originalPrice?: number;

  @Column('varchar', { length: 500, nullable: true })
  imageUrl?: string;

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
    enum: RewardStatusEntity,
    default: RewardStatusEntity.ACTIVE,
  })
  status: RewardStatusEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => UserRewardEntity, (userReward) => userReward.reward)
  userRewards: UserRewardEntity[];
}
