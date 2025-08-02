import { Injectable, Inject } from '@nestjs/common';
import type { IRewardRepository } from '../../../domain/reward/repositories/reward.repository.interface';
import { REWARD_REPOSITORY } from '../../../domain/reward/repositories/reward.repository.interface';
import { Reward, RewardStatus } from '../../../domain/reward/entities/reward.entity';

export interface GetRewardsRequest {
  status?: RewardStatus;
  limit?: number;
  offset?: number;
}

export interface GetRewardsResponse {
  rewards: Reward[];
  total: number;
  hasNext: boolean;
}

@Injectable()
export class GetRewardsUseCase {
  constructor(
    @Inject(REWARD_REPOSITORY)
    private readonly rewardRepository: IRewardRepository,
  ) {}

  async execute(request: GetRewardsRequest): Promise<GetRewardsResponse> {
    const { status, limit = 10, offset = 0 } = request;

    let rewards: Reward[];

    if (status) {
      rewards = await this.rewardRepository.findByStatus(status);
    } else {
      rewards = await this.rewardRepository.findAvailableRewards();
    }

    const total = rewards.length;
    const paginatedRewards = rewards.slice(offset, offset + limit);
    const hasNext = offset + limit < total;

    return {
      rewards: paginatedRewards,
      total,
      hasNext,
    };
  }
}