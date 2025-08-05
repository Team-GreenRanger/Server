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
          // 도메인 엔티티의 메서드를 보존하기 위해 직접 프로퍼티 할당
          (userMission as any).mission = mission;
          return userMission as UserMission & { mission?: Mission | null };
        })
      );

      return {
        userMissions: userMissionsWithDetails,
        isNewAssignment: false,
      };
    }

    // 사용 가능한 랜덤 미션 찾기 (5개 요청하지만 적어도 1개는 필요)
    const randomMissions = await this.missionRepository.findRandomActiveMissions(5);
    
    console.log(`Found ${randomMissions.length} random active missions for user ${userId}`); // 디버깅
    
    if (randomMissions.length === 0) {
      console.error('No active missions available in database');
      throw new Error('No active missions available');
    }

    const userMissions: (UserMission & { mission?: Mission | null })[] = [];
    
    // 발견된 모든 미션을 할당 (최대 5개, 최소 1개)
    for (const mission of randomMissions) {
      console.log(`Assigning mission: ${mission.title} (${mission.id}) to user ${userId}`);
      
      const userMission = UserMission.create({
        userId,
        missionId: mission.id,
      });
      
      const savedUserMission = await this.userMissionRepository.save(userMission);
      console.log(`Successfully assigned mission ${mission.id} to user ${userId}`);
      
      // 도메인 엔티티의 메서드를 보존하기 위해 직접 프로퍼티 할당
      (savedUserMission as any).mission = mission;
      userMissions.push(savedUserMission as UserMission & { mission?: Mission | null });
    }

    console.log(`Total ${userMissions.length} missions assigned to user ${userId}`);

    return {
      userMissions,
      isNewAssignment: true,
    };
  }
}