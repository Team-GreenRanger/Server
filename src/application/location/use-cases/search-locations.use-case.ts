import { Injectable, Inject } from '@nestjs/common';
import type { ILocationRepository, LocationSearchOptions } from '../../../domain/location/repositories/location.repository.interface';
import { LOCATION_REPOSITORY } from '../../../domain/location/repositories/location.repository.interface';
import { EcoLocation, LocationType } from '../../../domain/location/entities/location.entity';

export interface SearchLocationsRequest {
  type?: LocationType;
  latitude?: number;
  longitude?: number;
  radius?: number;
  limit?: number;
  offset?: number;
}

export interface SearchLocationsResponse {
  locations: EcoLocation[];
  total: number;
  hasNext: boolean;
}

@Injectable()
export class SearchLocationsUseCase {
  constructor(
    @Inject(LOCATION_REPOSITORY)
    private readonly locationRepository: ILocationRepository,
  ) {}

  async execute(request: SearchLocationsRequest): Promise<SearchLocationsResponse> {
    const { 
      type, 
      latitude, 
      longitude, 
      radius, 
      limit = 10, 
      offset = 0 
    } = request;

    const searchOptions: LocationSearchOptions = {
      type,
      latitude,
      longitude,
      radius,
      limit,
      offset,
    };

    const result = await this.locationRepository.searchLocations(searchOptions);
    const hasNext = offset + limit < result.total;

    return {
      locations: result.locations,
      total: result.total,
      hasNext,
    };
  }
}