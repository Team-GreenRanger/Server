import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CarbonCredit, CarbonCreditTransaction, TransactionType, TransactionStatus } from '../../../domain/carbon-credit/entities/carbon-credit.entity';
import { ICarbonCreditRepository } from '../../../domain/carbon-credit/repositories/carbon-credit.repository.interface';
import { CarbonCreditEntity } from '../entities/carbon-credit.entity';
import { CarbonCreditTransactionEntity, TransactionTypeEntity, TransactionStatusEntity } from '../entities/carbon-credit-transaction.entity';

@Injectable()
export class TypeOrmCarbonCreditRepository implements ICarbonCreditRepository {
  constructor(
    @InjectRepository(CarbonCreditEntity)
    private readonly carbonCreditRepository: Repository<CarbonCreditEntity>,
    @InjectRepository(CarbonCreditTransactionEntity)
    private readonly transactionRepository: Repository<CarbonCreditTransactionEntity>,
  ) {}

  async save(carbonCredit: CarbonCredit): Promise<CarbonCredit> {
    const carbonCreditEntity = this.toEntity(carbonCredit);
    const savedEntity = await this.carbonCreditRepository.save(carbonCreditEntity);
    return this.toDomain(savedEntity);
  }

  async findById(id: string): Promise<CarbonCredit | null> {
    const carbonCreditEntity = await this.carbonCreditRepository.findOne({ where: { id } });
    return carbonCreditEntity ? this.toDomain(carbonCreditEntity) : null;
  }

  async findByUserId(userId: string): Promise<CarbonCredit | null> {
    const carbonCreditEntity = await this.carbonCreditRepository.findOne({ where: { userId } });
    return carbonCreditEntity ? this.toDomain(carbonCreditEntity) : null;
  }

  async findAll(): Promise<CarbonCredit[]> {
    const carbonCreditEntities = await this.carbonCreditRepository.find();
    return carbonCreditEntities.map(entity => this.toDomain(entity));
  }

  async update(id: string, carbonCreditData: Partial<CarbonCredit>): Promise<CarbonCredit> {
    await this.carbonCreditRepository.update(id, carbonCreditData as any);
    const updatedEntity = await this.carbonCreditRepository.findOne({ where: { id } });
    if (!updatedEntity) {
      throw new Error('CarbonCredit not found after update');
    }
    return this.toDomain(updatedEntity);
  }

  async delete(id: string): Promise<void> {
    await this.carbonCreditRepository.delete(id);
  }

  // Transaction methods
  async saveTransaction(transaction: CarbonCreditTransaction): Promise<CarbonCreditTransaction> {
    const transactionEntity = this.toTransactionEntity(transaction);
    const savedEntity = await this.transactionRepository.save(transactionEntity);
    return this.toTransactionDomain(savedEntity);
  }

  async findTransactionById(id: string): Promise<CarbonCreditTransaction | null> {
    const transactionEntity = await this.transactionRepository.findOne({ where: { id } });
    return transactionEntity ? this.toTransactionDomain(transactionEntity) : null;
  }

  async findTransactionsByUserId(userId: string): Promise<CarbonCreditTransaction[]> {
    const transactionEntities = await this.transactionRepository.find({ 
      where: { userId },
      order: { createdAt: 'DESC' }
    });
    return transactionEntities.map(entity => this.toTransactionDomain(entity));
  }

  async findTransactionsByUserIdAndType(userId: string, type: TransactionType): Promise<CarbonCreditTransaction[]> {
    const transactionEntities = await this.transactionRepository.find({ 
      where: { 
        userId, 
        type: type as unknown as TransactionTypeEntity 
      },
      order: { createdAt: 'DESC' }
    });
    return transactionEntities.map(entity => this.toTransactionDomain(entity));
  }

  async findTransactionHistory(userId: string, limit: number = 20, offset: number = 0): Promise<{
    transactions: CarbonCreditTransaction[];
    total: number;
  }> {
    const [transactionEntities, total] = await this.transactionRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      transactions: transactionEntities.map(entity => this.toTransactionDomain(entity)),
      total,
    };
  }

  private toEntity(carbonCredit: CarbonCredit): CarbonCreditEntity {
    const entity = new CarbonCreditEntity();
    entity.id = carbonCredit.id;
    entity.userId = carbonCredit.userId;
    entity.balance = carbonCredit.balance;
    entity.totalEarned = carbonCredit.totalEarned;
    entity.totalSpent = carbonCredit.totalSpent;
    entity.createdAt = carbonCredit.createdAt;
    entity.updatedAt = carbonCredit.updatedAt;
    return entity;
  }

  private toDomain(entity: CarbonCreditEntity): CarbonCredit {
    return CarbonCredit.reconstitute({
      id: entity.id,
      userId: entity.userId,
      balance: entity.balance,
      totalEarned: entity.totalEarned,
      totalSpent: entity.totalSpent,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private toTransactionEntity(transaction: CarbonCreditTransaction): CarbonCreditTransactionEntity {
    const entity = new CarbonCreditTransactionEntity();
    entity.id = transaction.id;
    entity.userId = transaction.userId;
    entity.type = transaction.type as unknown as TransactionTypeEntity;
    entity.amount = transaction.amount;
    entity.description = transaction.description;
    entity.sourceType = transaction.sourceType;
    entity.sourceId = transaction.sourceId;
    entity.status = transaction.status as unknown as TransactionStatusEntity;
    entity.createdAt = transaction.createdAt;
    entity.updatedAt = transaction.updatedAt;
    return entity;
  }

  private toTransactionDomain(entity: CarbonCreditTransactionEntity): CarbonCreditTransaction {
    return CarbonCreditTransaction.reconstitute({
      id: entity.id,
      userId: entity.userId,
      type: entity.type as unknown as TransactionType,
      amount: entity.amount,
      description: entity.description,
      sourceType: entity.sourceType,
      sourceId: entity.sourceId,
      status: entity.status as unknown as TransactionStatus,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
