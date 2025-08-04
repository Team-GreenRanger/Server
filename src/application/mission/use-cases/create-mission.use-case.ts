import { Injectable, Inject } from '@nestjs/common';
import type { IMissionRepository } from '../../../domain/mission/repositories/mission.repository.interface';
import { MISSION_REPOSITORY } from '../../../domain/mission/repositories/mission.repository.interface';
import { Mission, MissionType, DifficultyLevel } from '../../../domain/mission/entities/mission.entity';

export interface CreateMissionRequest {
  title: string;
  description: string;
  type: MissionType;
  difficulty: DifficultyLevel;
  co2ReductionAmount: number;
  creditReward: number;
  requiredSubmissions?: number;
  imageUrl?: string;
  instructions: string[];
  verificationCriteria: string[];
}

export interface CreateMissionResponse {
  mission: Mission;
}

@Injectable()
export class CreateMissionUseCase {
  constructor(
    @Inject(MISSION_REPOSITORY)
    private readonly missionRepository: IMissionRepository,
  ) {}

  async execute(request: CreateMissionRequest): Promise<CreateMissionResponse> {
    const mission = Mission.create({
      title: request.title,
      description: request.description,
      type: request.type,
      difficulty: request.difficulty,
      co2ReductionAmount: request.co2ReductionAmount,
      creditReward: request.creditReward,
      requiredSubmissions: request.requiredSubmissions || 1,
      imageUrl: request.imageUrl,
      instructions: request.instructions,
      verificationCriteria: request.verificationCriteria,
    });

    const savedMission = await this.missionRepository.save(mission);

    return {
      mission: savedMission,
    };
  }
}