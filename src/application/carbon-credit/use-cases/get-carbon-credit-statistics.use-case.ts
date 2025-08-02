import { Injectable, Inject } from '@nestjs/common';
import type { ICarbonCreditRepository } from '../../../domain/carbon-credit/repositories/carbon-credit.repository.interface';
import { CARBON_CREDIT_REPOSITORY } from '../../../domain/carbon-credit/repositories/carbon-credit.repository.interface';

export interface GetCarbonCreditStatisticsRequest {
  userId: string;
}

export interface GetCarbonCreditStatisticsResponse {
  currentBalance: number;
  thisMonthEarned: number;
  thisMonthSpent: number;
  averageDailyEarnings: number;
  topEarningSource: string;
  globalRanking: number;
}

@Injectable()
export class GetCarbonCreditStatisticsUseCase {
  constructor(
    @Inject(CARBON_CREDIT_REPOSITORY)
    private readonly carbonCreditRepository: ICarbonCreditRepository,
  ) {}

  async execute(request: GetCarbonCreditStatisticsRequest): Promise<GetCarbonCreditStatisticsResponse> {
    const { userId } = request;

    const carbonCredit = await this.carbonCreditRepository.findByUserId(userId);
    if (!carbonCredit) {
      throw new Error('Carbon credit account not found');
    }

    // Get this month's transactions
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const allTransactions = await this.carbonCreditRepository.findTransactionsByUserId(userId);
    
    const thisMonthTransactions = allTransactions.filter(
      transaction => transaction.createdAt >= startOfMonth
    );

    const thisMonthEarned = thisMonthTransactions
      .filter(t => t.type === 'EARNED')
      .reduce((sum, t) => sum + t.amount, 0);

    const thisMonthSpent = thisMonthTransactions
      .filter(t => t.type === 'SPENT')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate average daily earnings (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last30DaysTransactions = allTransactions.filter(
      transaction => transaction.createdAt >= thirtyDaysAgo && transaction.type === 'EARNED'
    );
    
    const totalEarnedLast30Days = last30DaysTransactions.reduce((sum, t) => sum + t.amount, 0);
    const averageDailyEarnings = Math.round(totalEarnedLast30Days / 30);

    // Find top earning source
    const sourceMap = new Map<string, number>();
    allTransactions
      .filter(t => t.type === 'EARNED')
      .forEach(t => {
        const current = sourceMap.get(t.sourceType) || 0;
        sourceMap.set(t.sourceType, current + t.amount);
      });

    let topEarningSource = 'MISSION';
    let maxEarned = 0;
    for (const [source, amount] of sourceMap) {
      if (amount > maxEarned) {
        maxEarned = amount;
        topEarningSource = source;
      }
    }

    // Mock global ranking (in production, this would query all users)
    const globalRanking = Math.floor(Math.random() * 1000) + 1;

    return {
      currentBalance: carbonCredit.balance,
      thisMonthEarned,
      thisMonthSpent,
      averageDailyEarnings,
      topEarningSource,
      globalRanking,
    };
  }
}