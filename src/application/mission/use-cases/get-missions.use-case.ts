import { Injectable, Inject } from '@nestjs/common';
import type { IMissionRepository } from '../../../domain/mission/repositories/mission.repository.interface';
import { MISSION_REPOSITORY } from '../../../domain/mission/repositories/mission.repository.interface';
import { Mission, MissionStatus } from '../../../domain/mission/entities/mission.entity';

export interface GetMissionsRequest {
  status?: MissionStatus;
  type?: string;
}

export interface GetMissionsResponse {
  missions: Mission[];
}

@Injectable()
export class GetMissionsUseCase {
  constructor(
    @Inject(MISSION_REPOSITORY)
    private readonly missionRepository: IMissionRepository,
  ) {}

  async execute(request: GetMissionsRequest): Promise<GetMissionsResponse> {
    const { status, type } = request;

    let missions: Mission[];

    if (status) {
      missions = await this.missionRepository.findByStatus(status);
    } else {
      missions = await this.missionRepository.findAll();
    }

    return {
      missions,
    };
  }
}