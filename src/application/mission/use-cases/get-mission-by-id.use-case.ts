import { Injectable, Inject } from '@nestjs/common';
import type { IMissionRepository } from '../../../domain/mission/repositories/mission.repository.interface';
import { MISSION_REPOSITORY } from '../../../domain/mission/repositories/mission.repository.interface';
import { Mission } from '../../../domain/mission/entities/mission.entity';

export interface GetMissionByIdRequest {
  id: string;
}

export interface GetMissionByIdResponse {
  mission: Mission;
}

@Injectable()
export class GetMissionByIdUseCase {
  constructor(
    @Inject(MISSION_REPOSITORY)
    private readonly missionRepository: IMissionRepository,
  ) {}

  async execute(request: GetMissionByIdRequest): Promise<GetMissionByIdResponse> {
    const { id } = request;

    const mission = await this.missionRepository.findById(id);
    
    if (!mission) {
      throw new Error('Mission not found');
    }

    return {
      mission,
    };
  }
}