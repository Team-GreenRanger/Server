import { Injectable, Inject } from '@nestjs/common';
import type { IUserMissionRepository } from '../../../domain/mission/repositories/mission.repository.interface';
import type { IMissionRepository } from '../../../domain/mission/repositories/mission.repository.interface';
import { USER_MISSION_REPOSITORY, MISSION_REPOSITORY } from '../../../domain/mission/repositories/mission.repository.interface';
import { UserMission, UserMissionStatus } from '../../../domain/mission/entities/user-mission.entity';
import { Mission } from '../../../domain/mission/entities/mission.entity';

export interface GetUserMissionsRequest {
  userId: string;
  status?: UserMissionStatus;
}

export interface GetUserMissionsResponse {
  userMissions: (UserMission & { mission?: Mission | null })[]; // Include mission details
}

@Injectable()
export class GetUserMissionsUseCase {
  constructor(
    @Inject(USER_MISSION_REPOSITORY)
    private readonly userMissionRepository: IUserMissionRepository,
    @Inject(MISSION_REPOSITORY)
    private readonly missionRepository: IMissionRepository,
  ) {}

  async execute(request: GetUserMissionsRequest): Promise<GetUserMissionsResponse> {
    const { userId, status } = request;

    let userMissions: UserMission[];

    if (status) {
      userMissions = await this.userMissionRepository.findByUserIdAndStatus(userId, status);
    } else {
      userMissions = await this.userMissionRepository.findByUserId(userId);
    }

    // Load mission details for each user mission
    const userMissionsWithDetails = await Promise.all(
      userMissions.map(async (userMission) => {
        const mission = await this.missionRepository.findById(userMission.missionId);
        // 도메인 엔티티의 메서드를 보존하기 위해 직접 프로퍼티 할당
        (userMission as any).mission = mission;
        return userMission as UserMission & { mission?: Mission | null };
      })
    );

    return {
      userMissions: userMissionsWithDetails,
    };
  }
}