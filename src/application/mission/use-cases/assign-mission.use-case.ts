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
    console.log(`=== ASSIGN MISSION USE CASE START ===`);
    console.log(`User ID: ${command.userId}`);
    console.log(`Mission ID: ${command.missionId}`);
    
    // Check if mission exists and is active
    const mission = await this.missionRepository.findById(command.missionId);
    if (!mission || !mission.isActive()) {
      console.error(`Mission not found or inactive: ${command.missionId}`);
      throw new Error('Mission not found or inactive');
    }
    console.log(`Mission found: ${mission.title}`);

    // Check if user already has this mission assigned
    const existingUserMission = await this.userMissionRepository.findUserMissionWithMission(
      command.userId,
      command.missionId
    );
    if (existingUserMission) {
      // 완료된 미션이면 재할당 불가 (409 Conflict)
      if (existingUserMission.isCompleted()) {
        console.log(`User ${command.userId} already completed mission ${command.missionId}, cannot assign again`);
        throw new Error('Mission already completed. Cannot assign again.');
      }
      
      // 진행 중이거나 할당된 미션이면 기존 미션 반환
      console.log(`User ${command.userId} has existing mission ${command.missionId} in status: ${existingUserMission.status}`);
      return existingUserMission;
    }

    // Create new user mission
    console.log(`Creating new user mission for user ${command.userId}`);
    const userMission = UserMission.create({
      userId: command.userId,
      missionId: command.missionId,
    });

    // Save user mission
    const savedUserMission = await this.userMissionRepository.save(userMission);
    console.log(`New user mission created with ID: ${savedUserMission.id}`);
    console.log(`=== ASSIGN MISSION USE CASE END ===`);
    
    return savedUserMission;
  }
}
