import { Injectable, Inject } from '@nestjs/common';
import type { ILocationRepository } from '../../../domain/location/repositories/location.repository.interface';
import { LOCATION_REPOSITORY } from '../../../domain/location/repositories/location.repository.interface';
import { EcoLocation } from '../../../domain/location/entities/location.entity';

export interface GetLocationByIdRequest {
  id: string;
}

export interface GetLocationByIdResponse {
  location: EcoLocation;
}

@Injectable()
export class GetLocationByIdUseCase {
  constructor(
    @Inject(LOCATION_REPOSITORY)
    private readonly locationRepository: ILocationRepository,
  ) {}

  async execute(request: GetLocationByIdRequest): Promise<GetLocationByIdResponse> {
    const { id } = request;

    const location = await this.locationRepository.findById(id);
    
    if (!location) {
      throw new Error('Location not found');
    }

    return {
      location,
    };
  }
}