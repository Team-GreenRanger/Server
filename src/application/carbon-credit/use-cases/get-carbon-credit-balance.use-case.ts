import { Injectable, Inject } from '@nestjs/common';
import { CarbonCredit } from '../../../domain/carbon-credit/entities/carbon-credit.entity';
import type { ICarbonCreditRepository } from '../../../domain/carbon-credit/repositories/carbon-credit.repository.interface';
import { CARBON_CREDIT_REPOSITORY } from '../../../domain/carbon-credit/repositories/carbon-credit.repository.interface';

export interface GetCarbonCreditBalanceQuery {
  userId: string;
}

export interface CarbonCreditBalanceResult {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class GetCarbonCreditBalanceUseCase {
  constructor(
    @Inject(CARBON_CREDIT_REPOSITORY)
    private readonly carbonCreditRepository: ICarbonCreditRepository,
  ) {}

  async execute(query: GetCarbonCreditBalanceQuery): Promise<CarbonCreditBalanceResult> {
    let carbonCredit = await this.carbonCreditRepository.findByUserId(query.userId);
    
    if (!carbonCredit) {
      // Create carbon credit account if it doesn't exist
      carbonCredit = CarbonCredit.create(query.userId);
      carbonCredit = await this.carbonCreditRepository.save(carbonCredit);
    }

    return {
      balance: carbonCredit.balance,
      totalEarned: carbonCredit.totalEarned,
      totalSpent: carbonCredit.totalSpent,
      createdAt: carbonCredit.createdAt,
      updatedAt: carbonCredit.updatedAt,
    };
  }
}
