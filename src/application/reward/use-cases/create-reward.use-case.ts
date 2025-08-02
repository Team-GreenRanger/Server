import { Injectable, Inject } from '@nestjs/common';
import type { IRewardRepository } from '../../../domain/reward/repositories/reward.repository.interface';
import { REWARD_REPOSITORY } from '../../../domain/reward/repositories/reward.repository.interface';
import { Reward, RewardType } from '../../../domain/reward/entities/reward.entity';

export interface CreateRewardRequest {
  title: string;
  description: string;
  type: RewardType;
  creditCost: number;
  barcodeImageUrl: string;
  originalPrice?: number;
  imageUrl?: string;
  partnerName?: string;
  partnerLogoUrl?: string;
  termsAndConditions?: string[];
  validityDays?: number;
  totalQuantity?: number;
}

export interface CreateRewardResponse {
  reward: Reward;
}

@Injectable()
export class CreateRewardUseCase {
  constructor(
    @Inject(REWARD_REPOSITORY)
    private readonly rewardRepository: IRewardRepository,
  ) {}

  async execute(request: CreateRewardRequest): Promise<CreateRewardResponse> {
    const reward = Reward.create({
      title: request.title,
      description: request.description,
      type: request.type,
      creditCost: request.creditCost,
      barcodeImageUrl: request.barcodeImageUrl,
      originalPrice: request.originalPrice,
      imageUrl: request.imageUrl,
      partnerName: request.partnerName,
      partnerLogoUrl: request.partnerLogoUrl,
      termsAndConditions: request.termsAndConditions,
      validityDays: request.validityDays,
      totalQuantity: request.totalQuantity,
    });

    const savedReward = await this.rewardRepository.save(reward);

    return {
      reward: savedReward,
    };
  }
}