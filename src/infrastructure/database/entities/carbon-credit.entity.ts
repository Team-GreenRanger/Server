import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { CarbonCreditTransactionEntity } from './carbon-credit-transaction.entity';

@Entity('carbon_credits')
export class CarbonCreditEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 36, unique: true })
  userId: string;

  @Column('int', { default: 0 })
  balance: number;

  @Column('int', { default: 0 })
  totalEarned: number;

  @Column('int', { default: 0 })
  totalSpent: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => UserEntity, (user) => user.carbonCredit)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;
}
