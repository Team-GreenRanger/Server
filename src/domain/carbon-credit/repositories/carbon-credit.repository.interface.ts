import { CarbonCredit, CarbonCreditTransaction, TransactionType } from '../entities/carbon-credit.entity';

export interface ICarbonCreditRepository {
  save(carbonCredit: CarbonCredit): Promise<CarbonCredit>;
  findById(id: string): Promise<CarbonCredit | null>;
  findByUserId(userId: string): Promise<CarbonCredit | null>;
  findAll(): Promise<CarbonCredit[]>;
  update(id: string, carbonCredit: Partial<CarbonCredit>): Promise<CarbonCredit>;
  delete(id: string): Promise<void>;
  
  // Transaction methods
  saveTransaction(transaction: CarbonCreditTransaction): Promise<CarbonCreditTransaction>;
  findTransactionById(id: string): Promise<CarbonCreditTransaction | null>;
  findTransactionsByUserId(userId: string): Promise<CarbonCreditTransaction[]>;
  findTransactionsByUserIdAndType(userId: string, type: TransactionType): Promise<CarbonCreditTransaction[]>;
  findTransactionHistory(userId: string, limit?: number, offset?: number): Promise<{
    transactions: CarbonCreditTransaction[];
    total: number;
  }>;
}

export const CARBON_CREDIT_REPOSITORY = Symbol('CARBON_CREDIT_REPOSITORY');
