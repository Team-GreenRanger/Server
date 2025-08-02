import { Injectable, Inject } from '@nestjs/common';
import type { ILocationRepository } from '../../../domain/location/repositories/location.repository.interface';
import { LOCATION_REPOSITORY } from '../../../domain/location/repositories/location.repository.interface';
import { EcoLocation } from '../../../domain/location/entities/location.entity';

export interface GetNearbyLocationsRequest {
  latitude: number;
  longitude: number;
  radius: number;
  limit?: number;
}

export interface GetNearbyLocationsResponse {
  locations: EcoLocation[];
}

@Injectable()
export class GetNearbyLocationsUseCase {
  constructor(
    @Inject(LOCATION_REPOSITORY)
    private readonly locationRepository: ILocationRepository,
  ) {}

  async execute(request: GetNearbyLocationsRequest): Promise<GetNearbyLocationsResponse> {
    const { latitude, longitude, radius, limit = 10 } = request;

    if (!latitude || !longitude) {
      throw new Error('Invalid coordinates provided');
    }

    if (radius <= 0 || radius > 50) {
      throw new Error('Radius must be between 0 and 50 km');
    }

    const locations = await this.locationRepository.findNearbyLocations(
      latitude,
      longitude,
      radius,
      limit
    );

    return {
      locations,
    };
  }
}