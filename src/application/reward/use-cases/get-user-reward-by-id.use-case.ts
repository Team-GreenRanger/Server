import { Injectable, Inject } from '@nestjs/common';
import type { IUserRewardRepository } from '../../../domain/reward/repositories/reward.repository.interface';
import { USER_REWARD_REPOSITORY } from '../../../domain/reward/repositories/reward.repository.interface';
import type { IRewardRepository } from '../../../domain/reward/repositories/reward.repository.interface';
import { REWARD_REPOSITORY } from '../../../domain/reward/repositories/reward.repository.interface';
import { UserReward } from '../../../domain/reward/entities/reward.entity';

export interface GetUserRewardByIdRequest {
  userId: string;
  userRewardId: string;
}

export interface GetUserRewardByIdResponse {
  userReward: UserReward;
  reward: any;
  barcodeImageUrl?: string;
}

@Injectable()
export class GetUserRewardByIdUseCase {
  constructor(
    @Inject(USER_REWARD_REPOSITORY)
    private readonly userRewardRepository: IUserRewardRepository,
    @Inject(REWARD_REPOSITORY)
    private readonly rewardRepository: IRewardRepository,
  ) {}

  async execute(request: GetUserRewardByIdRequest): Promise<GetUserRewardByIdResponse> {
    const { userId, userRewardId } = request;

    const userReward = await this.userRewardRepository.findById(userRewardId);
    
    if (!userReward) {
      throw new Error('User reward not found');
    }

    if (userReward.userId !== userId) {
      throw new Error('Access denied');
    }

    const reward = await this.rewardRepository.findById(userReward.rewardId);
    
    if (!reward) {
      throw new Error('Reward not found');
    }

    return {
      userReward,
      reward: {
        id: reward.id,
        title: reward.title,
        description: reward.description,
        type: reward.type,
        creditCost: reward.creditCost,
        imageUrl: reward.imageUrl,
        status: reward.status,
        createdAt: reward.createdAt,
      },
      barcodeImageUrl: userReward.isUsable() ? reward.barcodeImageUrl : undefined,
    };
  }
}