import { Injectable, Inject } from '@nestjs/common';
import type { IRewardRepository } from '../../../domain/reward/repositories/reward.repository.interface';
import { REWARD_REPOSITORY } from '../../../domain/reward/repositories/reward.repository.interface';
import { Reward, RewardType, RewardStatus } from '../../../domain/reward/entities/reward.entity';

export interface UpdateRewardRequest {
  id: string;
  title?: string;
  description?: string;
  creditCost?: number;
  imageUrl?: string;
  totalQuantity?: number;
  status?: RewardStatus;
}

export interface UpdateRewardResponse {
  reward: Reward;
}

@Injectable()
export class UpdateRewardUseCase {
  constructor(
    @Inject(REWARD_REPOSITORY)
    private readonly rewardRepository: IRewardRepository,
  ) {}

  async execute(request: UpdateRewardRequest): Promise<UpdateRewardResponse> {
    const { id, ...updateData } = request;

    const reward = await this.rewardRepository.findById(id);
    
    if (!reward) {
      throw new Error('Reward not found');
    }

    // Since domain entities are immutable, we need to update through repository
    const updatedReward = await this.rewardRepository.update(id, updateData);

    return {
      reward: updatedReward,
    };
  }
}