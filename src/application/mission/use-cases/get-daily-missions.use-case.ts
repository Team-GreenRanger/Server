import { Injectable, Inject } from '@nestjs/common';
import type { IMissionRepository } from '../../../domain/mission/repositories/mission.repository.interface';
import { MISSION_REPOSITORY } from '../../../domain/mission/repositories/mission.repository.interface';
import type { IUserMissionRepository } from '../../../domain/mission/repositories/mission.repository.interface';
import { USER_MISSION_REPOSITORY } from '../../../domain/mission/repositories/mission.repository.interface';
import { UserMission } from '../../../domain/mission/entities/user-mission.entity';

export interface GetDailyMissionsRequest {
  userId: string;
}

export interface GetDailyMissionsResponse {
  userMissions: UserMission[];
  isNewAssignment: boolean;
}

@Injectable()
export class GetDailyMissionsUseCase {
  constructor(
    @Inject(MISSION_REPOSITORY)
    private readonly missionRepository: IMissionRepository,
    @Inject(USER_MISSION_REPOSITORY)
    private readonly userMissionRepository: IUserMissionRepository,
  ) {}

  async execute(request: GetDailyMissionsRequest): Promise<GetDailyMissionsResponse> {
    const { userId } = request;

    // Check if user already has missions assigned today
    const todayMissions = await this.userMissionRepository.findTodayAssignedMissions(userId);

    if (todayMissions.length > 0) {
      return {
        userMissions: todayMissions,
        isNewAssignment: false,
      };
    }

    // Assign 5 random missions for today
    const randomMissions = await this.missionRepository.findRandomActiveMissions(5);
    
    if (randomMissions.length === 0) {
      throw new Error('No active missions available');
    }

    const userMissions: UserMission[] = [];
    
    for (const mission of randomMissions) {
      const userMission = UserMission.create({
        userId,
        missionId: mission.id,
        targetProgress: mission.requiredSubmissions, // 미션에서 설정한 필수 제출 횟수
      });
      
      const savedUserMission = await this.userMissionRepository.save(userMission);
      userMissions.push(savedUserMission);
    }

    return {
      userMissions,
      isNewAssignment: true,
    };
  }
}