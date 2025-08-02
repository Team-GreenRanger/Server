import { Reward, RewardStatus, RewardType, UserReward, UserRewardStatus } from '../entities/reward.entity';

export interface IRewardRepository {
  save(reward: Reward): Promise<Reward>;
  findById(id: string): Promise<Reward | null>;
  findAll(): Promise<Reward[]>;
  findByStatus(status: RewardStatus): Promise<Reward[]>;
  findByType(type: RewardType): Promise<Reward[]>;
  findAvailableRewards(): Promise<Reward[]>;
  update(id: string, reward: Partial<Reward>): Promise<Reward>;
  delete(id: string): Promise<void>;
}

export interface IUserRewardRepository {
  save(userReward: UserReward): Promise<UserReward>;
  findById(id: string): Promise<UserReward | null>;
  findByUserId(userId: string): Promise<UserReward[]>;
  findByUserIdAndStatus(userId: string, status: UserRewardStatus): Promise<UserReward[]>;
  findByRewardId(rewardId: string): Promise<UserReward[]>;
  findExpiredRewards(): Promise<UserReward[]>;
  update(id: string, userReward: Partial<UserReward>): Promise<UserReward>;
  delete(id: string): Promise<void>;
}

export const REWARD_REPOSITORY = Symbol('REWARD_REPOSITORY');
export const USER_REWARD_REPOSITORY = Symbol('USER_REWARD_REPOSITORY');