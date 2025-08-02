import { Injectable, Inject } from '@nestjs/common';
import type { ILocationReviewRepository } from '../../../domain/location/repositories/location.repository.interface';
import { LOCATION_REVIEW_REPOSITORY } from '../../../domain/location/repositories/location.repository.interface';
import type { ILocationRepository } from '../../../domain/location/repositories/location.repository.interface';
import { LOCATION_REPOSITORY } from '../../../domain/location/repositories/location.repository.interface';
import { LocationReview } from '../../../domain/location/entities/location.entity';

export interface CreateLocationReviewRequest {
  userId: string;
  locationId: string;
  userName: string;
  userProfileImage?: string;
  rating: number;
  comment: string;
}

export interface CreateLocationReviewResponse {
  review: LocationReview;
}

@Injectable()
export class CreateLocationReviewUseCase {
  constructor(
    @Inject(LOCATION_REVIEW_REPOSITORY)
    private readonly locationReviewRepository: ILocationReviewRepository,
    @Inject(LOCATION_REPOSITORY)
    private readonly locationRepository: ILocationRepository,
  ) {}

  async execute(request: CreateLocationReviewRequest): Promise<CreateLocationReviewResponse> {
    const { userId, locationId, userName, userProfileImage, rating, comment } = request;

    // Verify location exists
    const location = await this.locationRepository.findById(locationId);
    if (!location) {
      throw new Error('Location not found');
    }

    // Create review
    const review = LocationReview.create({
      locationId,
      userId,
      userName,
      userProfileImage,
      rating,
      comment,
    });

    const savedReview = await this.locationReviewRepository.save(review);

    // Update location rating
    const ratingInfo = await this.locationReviewRepository.calculateAverageRating(locationId);
    location.updateRating(ratingInfo.averageRating, ratingInfo.totalReviews);
    await this.locationRepository.save(location);

    return {
      review: savedReview,
    };
  }
}