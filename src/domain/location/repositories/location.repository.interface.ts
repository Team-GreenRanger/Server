import { EcoLocation, LocationType, LocationStatus, LocationReview } from '../entities/location.entity';

export interface LocationSearchOptions {
  type?: LocationType;
  latitude?: number;
  longitude?: number;
  radius?: number; // km
  limit?: number;
  offset?: number;
}

export interface ILocationRepository {
  save(location: EcoLocation): Promise<EcoLocation>;
  findById(id: string): Promise<EcoLocation | null>;
  findAll(): Promise<EcoLocation[]>;
  findByType(type: LocationType): Promise<EcoLocation[]>;
  findByStatus(status: LocationStatus): Promise<EcoLocation[]>;
  searchLocations(options: LocationSearchOptions): Promise<{
    locations: EcoLocation[];
    total: number;
  }>;
  findNearbyLocations(
    latitude: number,
    longitude: number,
    radius: number,
    limit?: number
  ): Promise<EcoLocation[]>;
  update(id: string, location: Partial<EcoLocation>): Promise<EcoLocation>;
  delete(id: string): Promise<void>;
  getLocationTypeStats(): Promise<Array<{
    type: LocationType;
    count: number;
    percentage: number;
  }>>;
}

export interface ILocationReviewRepository {
  save(review: LocationReview): Promise<LocationReview>;
  findById(id: string): Promise<LocationReview | null>;
  findByLocationId(locationId: string): Promise<LocationReview[]>;
  findByUserId(userId: string): Promise<LocationReview[]>;
  calculateAverageRating(locationId: string): Promise<{
    averageRating: number;
    totalReviews: number;
  }>;
  delete(id: string): Promise<void>;
}

export const LOCATION_REPOSITORY = Symbol('LOCATION_REPOSITORY');
export const LOCATION_REVIEW_REPOSITORY = Symbol('LOCATION_REVIEW_REPOSITORY');