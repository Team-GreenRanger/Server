import { Injectable, Inject } from '@nestjs/common';
import { UserMission } from '../../../domain/mission/entities/user-mission.entity';
import type { 
  IMissionRepository, 
  IUserMissionRepository
} from '../../../domain/mission/repositories/mission.repository.interface';
import {
  MISSION_REPOSITORY,
  USER_MISSION_REPOSITORY 
} from '../../../domain/mission/repositories/mission.repository.interface';

export interface AssignMissionCommand {
  userId: string;
  missionId: string;
  targetProgress?: number;
}

@Injectable()
export class AssignMissionUseCase {
  constructor(
    @Inject(MISSION_REPOSITORY)
    private readonly missionRepository: IMissionRepository,
    @Inject(USER_MISSION_REPOSITORY)
    private readonly userMissionRepository: IUserMissionRepository,
  ) {}

  async execute(command: AssignMissionCommand): Promise<UserMission> {
    // Check if mission exists and is active
    const mission = await this.missionRepository.findById(command.missionId);
    if (!mission || !mission.isActive()) {
      throw new Error('Mission not found or inactive');
    }

    // Check if user already has this mission assigned
    const existingUserMission = await this.userMissionRepository.findUserMissionWithMission(
      command.userId,
      command.missionId
    );
    if (existingUserMission) {
      // Return existing mission instead of throwing error
      return existingUserMission;
    }

    // Create user mission - targetProgress를 Mission의 requiredSubmissions로 설정
    const userMission = UserMission.create({
      userId: command.userId,
      missionId: command.missionId,
      targetProgress: command.targetProgress || mission.requiredSubmissions, // Mission의 requiredSubmissions 사용
    });

    // Save user mission
    return await this.userMissionRepository.save(userMission);
  }
}
