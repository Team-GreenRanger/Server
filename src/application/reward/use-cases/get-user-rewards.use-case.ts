import { Injectable, Inject } from '@nestjs/common';
import type { IUserRewardRepository, IRewardRepository } from '../../../domain/reward/repositories/reward.repository.interface';
import { USER_REWARD_REPOSITORY, REWARD_REPOSITORY } from '../../../domain/reward/repositories/reward.repository.interface';
import { UserReward, UserRewardStatus } from '../../../domain/reward/entities/reward.entity';

export interface GetUserRewardsRequest {
  userId: string;
  status?: UserRewardStatus;
  limit?: number;
  offset?: number;
}

export interface UserRewardWithDetails {
  userReward: UserReward;
  reward: any; // Will include reward details
}

export interface GetUserRewardsResponse {
  userRewards: UserRewardWithDetails[];
  total: number;
  hasNext: boolean;
}

@Injectable()
export class GetUserRewardsUseCase {
  constructor(
    @Inject(USER_REWARD_REPOSITORY)
    private readonly userRewardRepository: IUserRewardRepository,
    @Inject(REWARD_REPOSITORY)
    private readonly rewardRepository: IRewardRepository,
  ) {}

  async execute(request: GetUserRewardsRequest): Promise<GetUserRewardsResponse> {
    const { userId, status, limit = 10, offset = 0 } = request;

    let userRewards: UserReward[];

    if (status) {
      userRewards = await this.userRewardRepository.findByUserIdAndStatus(userId, status);
    } else {
      userRewards = await this.userRewardRepository.findByUserId(userId);
    }

    // Get reward details for each user reward
    const userRewardsWithDetails: UserRewardWithDetails[] = [];
    
    for (const userReward of userRewards) {
      const reward = await this.rewardRepository.findById(userReward.rewardId);
      if (reward) {
        userRewardsWithDetails.push({
          userReward,
          reward: {
            id: reward.id,
            title: reward.title,
            description: reward.description,
            type: reward.type,
            creditCost: reward.creditCost,
            imageUrl: reward.imageUrl,
            barcodeImageUrl: reward.barcodeImageUrl,
            status: reward.status,
            createdAt: reward.createdAt,
          },
        });
      }
    }

    const total = userRewardsWithDetails.length;
    const paginatedRewards = userRewardsWithDetails.slice(offset, offset + limit);
    const hasNext = offset + limit < total;

    return {
      userRewards: paginatedRewards,
      total,
      hasNext,
    };
  }
}