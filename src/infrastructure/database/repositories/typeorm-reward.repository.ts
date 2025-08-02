import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reward, RewardType, RewardStatus } from '../../../domain/reward/entities/reward.entity';
import { UserReward, UserRewardStatus } from '../../../domain/reward/entities/reward.entity';
import { IRewardRepository, IUserRewardRepository } from '../../../domain/reward/repositories/reward.repository.interface';
import { RewardEntity } from '../entities/reward.entity';
import { UserRewardEntity } from '../entities/user-reward.entity';

@Injectable()
export class TypeOrmRewardRepository implements IRewardRepository {
  constructor(
    @InjectRepository(RewardEntity)
    private readonly rewardRepository: Repository<RewardEntity>,
  ) {}

  async save(reward: Reward): Promise<Reward> {
    const rewardEntity = this.toEntity(reward);
    const savedEntity = await this.rewardRepository.save(rewardEntity);
    return this.toDomain(savedEntity);
  }

  async findById(id: string): Promise<Reward | null> {
    const entity = await this.rewardRepository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<Reward[]> {
    const entities = await this.rewardRepository.find({
      where: { status: RewardStatus.ACTIVE },
      order: { createdAt: 'DESC' }
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async findByStatus(status: RewardStatus): Promise<Reward[]> {
    const entities = await this.rewardRepository.find({
      where: { status },
      order: { createdAt: 'DESC' }
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async findByType(type: RewardType): Promise<Reward[]> {
    const entities = await this.rewardRepository.find({
      where: { type, status: RewardStatus.ACTIVE },
      order: { createdAt: 'DESC' }
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async findAvailableRewards(): Promise<Reward[]> {
    const entities = await this.rewardRepository.find({
      where: { status: RewardStatus.ACTIVE },
      order: { createdAt: 'DESC' }
    });
    return entities
      .map(entity => this.toDomain(entity))
      .filter(reward => reward.isAvailable());
  }

  async update(id: string, updateData: Partial<Reward>): Promise<Reward> {
    const entityUpdate: Partial<RewardEntity> = {};
    
    if (updateData.status) {
      entityUpdate.status = updateData.status;
    }
    
    await this.rewardRepository.update(id, entityUpdate);
    const updatedEntity = await this.rewardRepository.findOne({ where: { id } });
    if (!updatedEntity) {
      throw new Error('Reward not found after update');
    }
    return this.toDomain(updatedEntity);
  }

  async delete(id: string): Promise<void> {
    await this.rewardRepository.update(id, { status: RewardStatus.INACTIVE });
  }

  private toEntity(reward: Reward): RewardEntity {
    const entity = new RewardEntity();
    entity.id = reward.id;
    entity.title = reward.title;
    entity.description = reward.description;
    entity.type = reward.type;
    entity.creditCost = reward.creditCost;
    entity.barcodeImageUrl = reward.barcodeImageUrl;
    entity.originalPrice = reward.originalPrice;
    entity.imageUrl = reward.imageUrl;
    entity.partnerName = reward.partnerName;
    entity.partnerLogoUrl = reward.partnerLogoUrl;
    entity.termsAndConditions = reward.termsAndConditions;
    entity.validityDays = reward.validityDays;
    entity.totalQuantity = reward.totalQuantity;
    entity.remainingQuantity = reward.remainingQuantity;
    entity.status = reward.status;
    entity.createdAt = reward.createdAt;
    entity.updatedAt = reward.updatedAt;
    return entity;
  }

  private toDomain(entity: RewardEntity): Reward {
    return Reward.reconstitute({
      id: entity.id,
      title: entity.title,
      description: entity.description,
      type: entity.type,
      creditCost: entity.creditCost,
      barcodeImageUrl: entity.barcodeImageUrl,
      originalPrice: entity.originalPrice,
      imageUrl: entity.imageUrl,
      partnerName: entity.partnerName,
      partnerLogoUrl: entity.partnerLogoUrl,
      termsAndConditions: entity.termsAndConditions,
      validityDays: entity.validityDays,
      totalQuantity: entity.totalQuantity,
      remainingQuantity: entity.remainingQuantity,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}

@Injectable()
export class TypeOrmUserRewardRepository implements IUserRewardRepository {
  constructor(
    @InjectRepository(UserRewardEntity)
    private readonly userRewardRepository: Repository<UserRewardEntity>,
  ) {}

  async save(userReward: UserReward): Promise<UserReward> {
    const userRewardEntity = this.toEntity(userReward);
    const savedEntity = await this.userRewardRepository.save(userRewardEntity);
    return this.toDomain(savedEntity);
  }

  async findById(id: string): Promise<UserReward | null> {
    const entity = await this.userRewardRepository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByUserId(userId: string): Promise<UserReward[]> {
    const entities = await this.userRewardRepository.find({
      where: { userId },
      order: { purchasedAt: 'DESC' }
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async findByUserIdAndStatus(userId: string, status: UserRewardStatus): Promise<UserReward[]> {
    const entities = await this.userRewardRepository.find({
      where: { userId, status },
      order: { purchasedAt: 'DESC' }
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async findByUserIdAndRewardId(userId: string, rewardId: string): Promise<UserReward | null> {
    const entity = await this.userRewardRepository.findOne({
      where: { userId, rewardId }
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByRewardId(rewardId: string): Promise<UserReward[]> {
    const entities = await this.userRewardRepository.find({
      where: { rewardId },
      order: { purchasedAt: 'DESC' }
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async findExpiredRewards(): Promise<UserReward[]> {
    const entities = await this.userRewardRepository
      .createQueryBuilder('userReward')
      .where('userReward.expiresAt < :now', { now: new Date() })
      .andWhere('userReward.status = :status', { status: UserRewardStatus.PURCHASED })
      .getMany();
    
    return entities.map(entity => this.toDomain(entity));
  }

  async update(id: string, userReward: Partial<UserReward>): Promise<UserReward> {
    const entityUpdate: Partial<UserRewardEntity> = {};
    
    if (userReward.status) {
      entityUpdate.status = userReward.status;
    }
    if (userReward.usedAt) {
      entityUpdate.usedAt = userReward.usedAt;
    }
    
    await this.userRewardRepository.update(id, entityUpdate);
    const updatedEntity = await this.userRewardRepository.findOne({ where: { id } });
    if (!updatedEntity) {
      throw new Error('UserReward not found after update');
    }
    return this.toDomain(updatedEntity);
  }

  async delete(id: string): Promise<void> {
    await this.userRewardRepository.delete(id);
  }

  private toEntity(userReward: UserReward): UserRewardEntity {
    const entity = new UserRewardEntity();
    entity.id = userReward.id;
    entity.userId = userReward.userId;
    entity.rewardId = userReward.rewardId;
    entity.transactionId = userReward.transactionId;
    entity.status = userReward.status;
    entity.couponCode = userReward.couponCode;
    entity.purchasedAt = userReward.purchasedAt;
    entity.usedAt = userReward.usedAt;
    entity.expiresAt = userReward.expiresAt;
    entity.updatedAt = userReward.updatedAt;
    return entity;
  }

  private toDomain(entity: UserRewardEntity): UserReward {
    return UserReward.reconstitute({
      id: entity.id,
      userId: entity.userId,
      rewardId: entity.rewardId,
      transactionId: entity.transactionId,
      status: entity.status,
      couponCode: entity.couponCode,
      purchasedAt: entity.purchasedAt,
      usedAt: entity.usedAt,
      expiresAt: entity.expiresAt,
      updatedAt: entity.updatedAt,
    });
  }
}
