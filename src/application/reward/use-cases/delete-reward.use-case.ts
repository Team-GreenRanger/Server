import { Injectable, Inject } from '@nestjs/common';
import type { IRewardRepository } from '../../../domain/reward/repositories/reward.repository.interface';
import { REWARD_REPOSITORY } from '../../../domain/reward/repositories/reward.repository.interface';

export interface DeleteRewardRequest {
  id: string;
}

export interface DeleteRewardResponse {
  message: string;
}

@Injectable()
export class DeleteRewardUseCase {
  constructor(
    @Inject(REWARD_REPOSITORY)
    private readonly rewardRepository: IRewardRepository,
  ) {}

  async execute(request: DeleteRewardRequest): Promise<DeleteRewardResponse> {
    const { id } = request;

    const reward = await this.rewardRepository.findById(id);
    
    if (!reward) {
      throw new Error('Reward not found');
    }

    await this.rewardRepository.delete(id);

    return {
      message: 'Reward deleted successfully',
    };
  }
}