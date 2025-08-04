import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty({ description: 'Total number of users' })
  totalUsers: number;

  @ApiProperty({ description: 'Number of active users' })
  activeUsers: number;

  @ApiProperty({ description: 'Number of verified users' })
  verifiedUsers: number;

  @ApiProperty({ description: 'Total number of missions' })
  totalMissions: number;

  @ApiProperty({ description: 'Number of active missions' })
  activeMissions: number;

  @ApiProperty({ description: 'Total completed user missions' })
  totalCompletedMissions: number;

  @ApiProperty({ description: 'Pending mission verifications' })
  pendingVerifications: number;

  @ApiProperty({ description: 'Total carbon credits issued' })
  totalCarbonCreditsIssued: number;

  @ApiProperty({ description: 'Total CO2 reduction amount (kg)' })
  totalCo2Reduction: number;

  @ApiProperty({ description: 'User registrations in last 30 days' })
  newUsersLast30Days: number;

  @ApiProperty({ description: 'Mission completions in last 30 days' })
  missionsCompletedLast30Days: number;
}

export class RecentActivityDto {
  @ApiProperty({ description: 'Activity ID' })
  id: string;

  @ApiProperty({ description: 'Activity type' })
  type: 'USER_REGISTERED' | 'MISSION_COMPLETED' | 'MISSION_SUBMITTED' | 'REWARD_REDEEMED';

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'User name' })
  userName: string;

  @ApiProperty({ description: 'Activity description' })
  description: string;

  @ApiProperty({ description: 'Activity timestamp' })
  timestamp: Date;
}

export class DashboardResponseDto {
  @ApiProperty({ description: 'Dashboard statistics' })
  stats: DashboardStatsDto;

  @ApiProperty({ type: [RecentActivityDto], description: 'Recent activities' })
  recentActivities: RecentActivityDto[];
}