import { Injectable, Inject } from '@nestjs/common';
import type { IRewardRepository, IUserRewardRepository } from '../../../domain/reward/repositories/reward.repository.interface';
import { REWARD_REPOSITORY, USER_REWARD_REPOSITORY } from '../../../domain/reward/repositories/reward.repository.interface';
import type { ICarbonCreditRepository } from '../../../domain/carbon-credit/repositories/carbon-credit.repository.interface';
import { CARBON_CREDIT_REPOSITORY } from '../../../domain/carbon-credit/repositories/carbon-credit.repository.interface';
import { Reward, UserReward } from '../../../domain/reward/entities/reward.entity';
import { CarbonCreditTransaction, TransactionType } from '../../../domain/carbon-credit/entities/carbon-credit.entity';
import { v4 as uuidv4 } from 'uuid';

export interface RedeemRewardRequest {
  userId: string;
  rewardId: string;
  deliveryAddress?: string;
}

export interface RedeemRewardResponse {
  userReward: UserReward;
  barcodeImageUrl: string;
}

@Injectable()
export class RedeemRewardUseCase {
  constructor(
    @Inject(REWARD_REPOSITORY)
    private readonly rewardRepository: IRewardRepository,
    @Inject(USER_REWARD_REPOSITORY)
    private readonly userRewardRepository: IUserRewardRepository,
    @Inject(CARBON_CREDIT_REPOSITORY)
    private readonly carbonCreditRepository: ICarbonCreditRepository,
  ) {}

  async execute(request: RedeemRewardRequest): Promise<RedeemRewardResponse> {
    const { userId, rewardId, deliveryAddress } = request;

    // Get reward
    const reward = await this.rewardRepository.findById(rewardId);
    if (!reward) {
      throw new Error('Reward not found');
    }

    if (!reward.isAvailable()) {
      throw new Error('Reward is not available');
    }

    // Get user's carbon credit balance
    const carbonCredit = await this.carbonCreditRepository.findByUserId(userId);
    if (!carbonCredit) {
      throw new Error('Carbon credit account not found');
    }

    if (!carbonCredit.canSpend(reward.creditCost)) {
      throw new Error('Insufficient carbon credits');
    }

    // Create transaction
    const transaction = CarbonCreditTransaction.create({
      userId,
      type: TransactionType.SPENT,
      amount: reward.creditCost,
      description: `Redeemed reward: ${reward.title}`,
      sourceType: 'REWARD',
      sourceId: rewardId,
    });

    // Spend carbon credits
    carbonCredit.spend(reward.creditCost);
    transaction.complete();

    // Decrease reward quantity
    reward.decreaseQuantity();

    // Create user reward with coupon code
    const couponCode = this.generateCouponCode();
    const userReward = UserReward.create({
      userId,
      rewardId,
      transactionId: transaction.id,
      validityDays: reward.validityDays,
      couponCode,
    });

    // Save all entities
    await this.carbonCreditRepository.save(carbonCredit);
    await this.carbonCreditRepository.saveTransaction(transaction);
    await this.rewardRepository.save(reward);
    const savedUserReward = await this.userRewardRepository.save(userReward);

    return {
      userReward: savedUserReward,
      barcodeImageUrl: reward.barcodeImageUrl,
    };
  }

  private generateCouponCode(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `EC${timestamp}${random}`;
  }
}