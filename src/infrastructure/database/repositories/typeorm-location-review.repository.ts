import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocationReview } from '../../../domain/location/entities/location.entity';
import { ILocationReviewRepository } from '../../../domain/location/repositories/location.repository.interface';
import { LocationReviewEntity } from '../entities/location-review.entity';

@Injectable()
export class TypeOrmLocationReviewRepository implements ILocationReviewRepository {
  constructor(
    @InjectRepository(LocationReviewEntity)
    private readonly locationReviewRepository: Repository<LocationReviewEntity>,
  ) {}

  async save(review: LocationReview): Promise<LocationReview> {
    const reviewEntity = this.toEntity(review);
    const savedEntity = await this.locationReviewRepository.save(reviewEntity);
    return this.toDomain(savedEntity);
  }

  async findById(id: string): Promise<LocationReview | null> {
    const entity = await this.locationReviewRepository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByLocationId(locationId: string): Promise<LocationReview[]> {
    const entities = await this.locationReviewRepository.find({
      where: { locationId },
      order: { createdAt: 'DESC' }
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async findByUserId(userId: string): Promise<LocationReview[]> {
    const entities = await this.locationReviewRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async calculateAverageRating(locationId: string): Promise<{
    averageRating: number;
    totalReviews: number;
  }> {
    const result = await this.locationReviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'averageRating')
      .addSelect('COUNT(review.id)', 'totalReviews')
      .where('review.locationId = :locationId', { locationId })
      .getRawOne();

    return {
      averageRating: parseFloat(result.averageRating) || 0,
      totalReviews: parseInt(result.totalReviews) || 0,
    };
  }

  async delete(id: string): Promise<void> {
    await this.locationReviewRepository.delete(id);
  }

  private toEntity(review: LocationReview): LocationReviewEntity {
    const entity = new LocationReviewEntity();
    entity.id = review.id;
    entity.locationId = review.locationId;
    entity.userId = review.userId;
    entity.userName = review.userName;
    entity.userProfileImage = review.userProfileImage;
    entity.rating = review.rating;
    entity.comment = review.comment;
    entity.createdAt = review.createdAt;
    return entity;
  }

  private toDomain(entity: LocationReviewEntity): LocationReview {
    return LocationReview.reconstitute({
      id: entity.id,
      locationId: entity.locationId,
      userId: entity.userId,
      userName: entity.userName,
      userProfileImage: entity.userProfileImage,
      rating: entity.rating,
      comment: entity.comment,
      createdAt: entity.createdAt,
    });
  }
}
