import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { UserMissionEntity } from './user-mission.entity';
import { CarbonCreditEntity } from './carbon-credit.entity';
import { UserRewardEntity } from './user-reward.entity';
import { CarbonCreditTransactionEntity } from './carbon-credit-transaction.entity';

@Entity('tbl_users')
export class UserEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 255, unique: true })
  email: string;

  @Column('varchar', { length: 100 })
  name: string;

  @Column('varchar', { length: 255 })
  hashedPassword: string;

  @Column('varchar', { length: 500, nullable: true })
  profileImageUrl?: string;

  @Column('varchar', { length: 100, nullable: true })
  nationality?: string;

  @Column('int', { nullable: true })
  age?: number;

  @Column('int', { default: 0 })
  totalMissionSolved: number;

  @Column('boolean', { default: false })
  isVerified: boolean;

  @Column('boolean', { default: true })
  isActive: boolean;

  @Column('boolean', { default: false })
  isAdmin: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => UserMissionEntity, (userMission) => userMission.user)
  userMissions: UserMissionEntity[];

  @OneToOne(() => CarbonCreditEntity, (carbonCredit) => carbonCredit.user)
  carbonCredit: CarbonCreditEntity;

  @OneToMany(() => UserRewardEntity, (userReward) => userReward.user)
  userRewards: UserRewardEntity[];

  @OneToMany(() => CarbonCreditTransactionEntity, (transaction) => transaction.user)
  carbonCreditTransactions: CarbonCreditTransactionEntity[];
}
