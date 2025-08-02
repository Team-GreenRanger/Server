import { Injectable, Inject } from '@nestjs/common';
import type { ILocationReviewRepository } from '../../../domain/location/repositories/location.repository.interface';
import { LOCATION_REVIEW_REPOSITORY } from '../../../domain/location/repositories/location.repository.interface';
import { LocationReview } from '../../../domain/location/entities/location.entity';

export interface GetLocationReviewsRequest {
  locationId: string;
  limit?: number;
  offset?: number;
}

export interface GetLocationReviewsResponse {
  reviews: LocationReview[];
  averageRating: number;
  total: number;
  hasNext: boolean;
}

@Injectable()
export class GetLocationReviewsUseCase {
  constructor(
    @Inject(LOCATION_REVIEW_REPOSITORY)
    private readonly locationReviewRepository: ILocationReviewRepository,
  ) {}

  async execute(request: GetLocationReviewsRequest): Promise<GetLocationReviewsResponse> {
    const { locationId, limit = 10, offset = 0 } = request;

    const reviews = await this.locationReviewRepository.findByLocationId(locationId);
    const ratingInfo = await this.locationReviewRepository.calculateAverageRating(locationId);

    const total = reviews.length;
    const paginatedReviews = reviews.slice(offset, offset + limit);
    const hasNext = offset + limit < total;

    return {
      reviews: paginatedReviews,
      averageRating: ratingInfo.averageRating,
      total: ratingInfo.totalReviews,
      hasNext,
    };
  }
}