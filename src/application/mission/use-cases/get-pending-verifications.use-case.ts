import { Injectable, Inject } from '@nestjs/common';
import { UserMission } from '../../../domain/mission/entities/user-mission.entity';
import { Mission } from '../../../domain/mission/entities/mission.entity';
import type { IUserMissionRepository, IMissionRepository } from '../../../domain/mission/repositories/mission.repository.interface';
import { USER_MISSION_REPOSITORY, MISSION_REPOSITORY } from '../../../domain/mission/repositories/mission.repository.interface';

export interface GetPendingVerificationsResponse {
  userMissions: (UserMission & { mission?: Mission | null })[];
}

@Injectable()
export class GetPendingVerificationsUseCase {
  constructor(
    @Inject(USER_MISSION_REPOSITORY)
    private readonly userMissionRepository: IUserMissionRepository,
    @Inject(MISSION_REPOSITORY)
    private readonly missionRepository: IMissionRepository,
  ) {}

  async execute(): Promise<GetPendingVerificationsResponse> {
    // Get all pending verifications
    const pendingUserMissions = await this.userMissionRepository.findPendingVerifications();

    // Load mission details for each user mission
    const userMissionsWithDetails = await Promise.all(
      pendingUserMissions.map(async (userMission) => {
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
