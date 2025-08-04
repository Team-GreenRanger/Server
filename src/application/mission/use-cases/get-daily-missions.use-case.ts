import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IMissionRepository } from '../../../domain/mission/repositories/mission.repository.interface';
import { MISSION_REPOSITORY } from '../../../domain/mission/repositories/mission.repository.interface';
import type { IUserMissionRepository } from '../../../domain/mission/repositories/mission.repository.interface';
import { USER_MISSION_REPOSITORY } from '../../../domain/mission/repositories/mission.repository.interface';
import type { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../../../domain/user/repositories/user.repository.interface';
import { UserMission } from '../../../domain/mission/entities/user-mission.entity';
import { Mission } from '../../../domain/mission/entities/mission.entity';

export interface GetDailyMissionsRequest {
  userId: string;
}

export interface GetDailyMissionsResponse {
  userMissions: (UserMission & { mission?: Mission | null })[];
  isNewAssignment: boolean;
}

@Injectable()
export class GetDailyMissionsUseCase {
  constructor(
    @Inject(MISSION_REPOSITORY)
    private readonly missionRepository: IMissionRepository,
    @Inject(USER_MISSION_REPOSITORY)
    private readonly userMissionRepository: IUserMissionRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: GetDailyMissionsRequest): Promise<GetDailyMissionsResponse> {
    const { userId } = request;

    // Verify user exists and is active
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isActive) {
      throw new Error('User account is deactivated');
    }

    // Check if user already has missions assigned today
    const todayMissions = await this.userMissionRepository.findTodayAssignedMissions(userId);

    if (todayMissions.length > 0) {
      // Load mission details for existing missions
      const userMissionsWithDetails = await Promise.all(
        todayMissions.map(async (userMission) => {
          const mission = await this.missionRepository.findById(userMission.missionId);
          return {
            ...userMission,
            mission
          } as UserMission & { mission?: Mission | null };
        })
      );

      return {
        userMissions: userMissionsWithDetails,
        isNewAssignment: false,
      };
    }

    // Assign 5 random missions for today
    const randomMissions = await this.missionRepository.findRandomActiveMissions(5);
    
    if (randomMissions.length === 0) {
      throw new Error('No active missions available');
    }

    const userMissions: (UserMission & { mission?: Mission | null })[] = [];
    
    for (const mission of randomMissions) {
      const userMission = UserMission.create({
        userId,
        missionId: mission.id,
        targetProgress: mission.requiredSubmissions, // 미션에서 설정한 필수 제출 횟수
      });
      
      const savedUserMission = await this.userMissionRepository.save(userMission);
      
      // Include mission details
      userMissions.push({
        ...savedUserMission,
        mission
      } as UserMission & { mission?: Mission | null });
    }

    return {
      userMissions,
      isNewAssignment: true,
    };
  }
}