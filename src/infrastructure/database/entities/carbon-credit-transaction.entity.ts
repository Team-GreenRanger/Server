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
import { CarbonCreditEntity } from './carbon-credit.entity';

export enum TransactionTypeEntity {
  EARNED = 'EARNED',
  SPENT = 'SPENT',
  REFUNDED = 'REFUNDED',
}

export enum TransactionStatusEntity {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

@Entity('tbl_carbon_credit_transactions')
export class CarbonCreditTransactionEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 36 })
  userId: string;

  @Column({
    type: 'enum',
    enum: TransactionTypeEntity,
  })
  type: TransactionTypeEntity;

  @Column('int')
  amount: number;

  @Column('varchar', { length: 200 })
  description: string;

  @Column('varchar', { length: 50 })
  sourceType: string;

  @Column('varchar', { length: 36, nullable: true })
  sourceId?: string;

  @Column({
    type: 'enum',
    enum: TransactionStatusEntity,
    default: TransactionStatusEntity.PENDING,
  })
  status: TransactionStatusEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => UserEntity, (user) => user.carbonCreditTransactions)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;
}
