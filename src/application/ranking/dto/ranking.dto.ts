import { IsOptional, IsNumber, Min, Max, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum RankingPeriodDto {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  ALL_TIME = 'ALL_TIME',
}

export enum RankingTypeDto {
  CARBON_CREDITS = 'CARBON_CREDITS',
  MISSIONS_COMPLETED = 'MISSIONS_COMPLETED',
  CO2_REDUCTION = 'CO2_REDUCTION',
}

export class UserRankingDto {
  @ApiProperty({ description: 'Ranking position' })
  rank: number;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'User name' })
  userName: string;

  @ApiPropertyOptional({ description: 'User profile image URL' })
  profileImageUrl?: string;

  @ApiProperty({ description: 'Score value (carbon credits, missions, etc.)' })
  score: number;

  @ApiProperty({ description: 'Whether this is the current user' })
  isCurrentUser: boolean;
}

export class RankingListQueryDto {
  @ApiPropertyOptional({ enum: RankingTypeDto, description: 'Ranking type' })
  @IsOptional()
  @IsEnum(RankingTypeDto)
  type?: RankingTypeDto;

  @ApiPropertyOptional({ enum: RankingPeriodDto, description: 'Ranking period' })
  @IsOptional()
  @IsEnum(RankingPeriodDto)
  period?: RankingPeriodDto;

  @ApiPropertyOptional({ description: 'Number of rankings to return', minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Number of rankings to skip', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offset?: number;
}

export class RankingListResponseDto {
  @ApiProperty({ type: [UserRankingDto], description: 'List of user rankings' })
  rankings: UserRankingDto[];

  @ApiProperty({ description: 'Total number of ranked users' })
  total: number;

  @ApiProperty({ enum: RankingTypeDto, description: 'Ranking type' })
  type: RankingTypeDto;

  @ApiProperty({ enum: RankingPeriodDto, description: 'Ranking period' })
  period: RankingPeriodDto;

  @ApiProperty({ description: 'Whether there are more rankings' })
  hasNext: boolean;
}

export class CurrentUserRankingDto {
  @ApiProperty({ description: 'Current user ranking position' })
  currentRank: number;

  @ApiProperty({ description: 'Current user score' })
  currentScore: number;

  @ApiProperty({ description: 'Previous ranking position' })
  previousRank: number;

  @ApiProperty({ description: 'Rank change (positive = improved, negative = declined)' })
  rankChange: number;

  @ApiProperty({ description: 'Score needed to reach next rank' })
  scoreToNextRank: number;

  @ApiProperty({ description: 'Next rank position' })
  nextRankPosition: number;
}

export class RankingStatsResponseDto {
  @ApiProperty({ description: 'Total number of active users' })
  totalUsers: number;

  @ApiProperty({ description: 'Current user ranking info' })
  currentUser: CurrentUserRankingDto;

  @ApiProperty({ description: 'Top 3 users in carbon credits' })
  topCarbonCreditUsers: UserRankingDto[];

  @ApiProperty({ description: 'Top 3 users in missions completed' })
  topMissionUsers: UserRankingDto[];

  @ApiProperty({ description: 'Top 3 users in CO2 reduction' })
  topCo2ReductionUsers: UserRankingDto[];
}

export class LeaderboardResponseDto {
  @ApiProperty({ description: 'Weekly rankings' })
  weekly: RankingListResponseDto;

  @ApiProperty({ description: 'Monthly rankings' })
  monthly: RankingListResponseDto;

  @ApiProperty({ description: 'All-time rankings' })
  allTime: RankingListResponseDto;

  @ApiProperty({ description: 'Current user stats' })
  currentUserStats: CurrentUserRankingDto;
}
