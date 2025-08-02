import { Injectable, Inject } from '@nestjs/common';
import type { ILocationRepository } from '../../../domain/location/repositories/location.repository.interface';
import { LOCATION_REPOSITORY } from '../../../domain/location/repositories/location.repository.interface';
import { LocationType } from '../../../domain/location/entities/location.entity';

export interface LocationTypeStats {
  type: LocationType;
  count: number;
  percentage: number;
}

export interface GetLocationTypeStatsResponse {
  totalLocations: number;
  typeStats: LocationTypeStats[];
}

@Injectable()
export class GetLocationTypeStatsUseCase {
  constructor(
    @Inject(LOCATION_REPOSITORY)
    private readonly locationRepository: ILocationRepository,
  ) {}

  async execute(): Promise<GetLocationTypeStatsResponse> {
    const typeStats = await this.locationRepository.getLocationTypeStats();
    const totalLocations = typeStats.reduce((sum, stat) => sum + stat.count, 0);

    return {
      totalLocations,
      typeStats,
    };
  }
}