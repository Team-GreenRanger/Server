import { Injectable, Inject } from '@nestjs/common';
import type { IUserMissionRepository } from '../../../domain/mission/repositories/mission.repository.interface';
import { USER_MISSION_REPOSITORY } from '../../../domain/mission/repositories/mission.repository.interface';
import { UserMission, UserMissionStatus } from '../../../domain/mission/entities/user-mission.entity';

export interface GetUserMissionsRequest {
  userId: string;
  status?: UserMissionStatus;
}

export interface GetUserMissionsResponse {
  userMissions: UserMission[];
}

@Injectable()
export class GetUserMissionsUseCase {
  constructor(
    @Inject(USER_MISSION_REPOSITORY)
    private readonly userMissionRepository: IUserMissionRepository,
  ) {}

  async execute(request: GetUserMissionsRequest): Promise<GetUserMissionsResponse> {
    const { userId, status } = request;

    let userMissions: UserMission[];

    if (status) {
      userMissions = await this.userMissionRepository.findByUserIdAndStatus(userId, status);
    } else {
      userMissions = await this.userMissionRepository.findByUserId(userId);
    }

    return {
      userMissions,
    };
  }
}