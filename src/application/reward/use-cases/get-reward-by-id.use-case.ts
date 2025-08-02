import { Injectable, Inject } from '@nestjs/common';
import type { IRewardRepository } from '../../../domain/reward/repositories/reward.repository.interface';
import { REWARD_REPOSITORY } from '../../../domain/reward/repositories/reward.repository.interface';
import { Reward } from '../../../domain/reward/entities/reward.entity';

export interface GetRewardByIdRequest {
  id: string;
}

export interface GetRewardByIdResponse {
  reward: Reward;
}

@Injectable()
export class GetRewardByIdUseCase {
  constructor(
    @Inject(REWARD_REPOSITORY)
    private readonly rewardRepository: IRewardRepository,
  ) {}

  async execute(request: GetRewardByIdRequest): Promise<GetRewardByIdResponse> {
    const { id } = request;

    const reward = await this.rewardRepository.findById(id);
    
    if (!reward) {
      throw new Error('Reward not found');
    }

    return {
      reward,
    };
  }
}