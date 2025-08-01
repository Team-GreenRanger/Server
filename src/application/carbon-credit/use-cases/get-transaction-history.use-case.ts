import { Injectable, Inject } from '@nestjs/common';
import { CarbonCreditTransaction, TransactionType } from '../../../domain/carbon-credit/entities/carbon-credit.entity';
import type { ICarbonCreditRepository } from '../../../domain/carbon-credit/repositories/carbon-credit.repository.interface';
import { CARBON_CREDIT_REPOSITORY } from '../../../domain/carbon-credit/repositories/carbon-credit.repository.interface';

export interface GetTransactionHistoryQuery {
  userId: string;
  type?: TransactionType;
  limit?: number;
  offset?: number;
}

export interface TransactionHistoryResult {
  transactions: CarbonCreditTransaction[];
  total: number;
  hasNext: boolean;
}

@Injectable()
export class GetTransactionHistoryUseCase {
  constructor(
    @Inject(CARBON_CREDIT_REPOSITORY)
    private readonly carbonCreditRepository: ICarbonCreditRepository,
  ) {}

  async execute(query: GetTransactionHistoryQuery): Promise<TransactionHistoryResult> {
    const limit = query.limit || 20;
    const offset = query.offset || 0;

    let transactions: CarbonCreditTransaction[];
    let total: number;

    if (query.type) {
      transactions = await this.carbonCreditRepository.findTransactionsByUserIdAndType(
        query.userId,
        query.type
      );
      // For type-filtered queries, we need to implement pagination separately
      total = transactions.length;
      transactions = transactions.slice(offset, offset + limit);
    } else {
      const result = await this.carbonCreditRepository.findTransactionHistory(
        query.userId,
        limit,
        offset
      );
      transactions = result.transactions;
      total = result.total;
    }

    const hasNext = offset + limit < total;

    return {
      transactions,
      total,
      hasNext,
    };
  }
}
