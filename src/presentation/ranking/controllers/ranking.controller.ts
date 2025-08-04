import { 
  Controller, 
  Get, 
  Query, 
  UseGuards,
  Request
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { 
  RankingListQueryDto,
  RankingListResponseDto,
  RankingStatsResponseDto,
  LeaderboardResponseDto,
  CurrentUserRankingDto,
  RankingTypeDto,
  RankingPeriodDto
} from '../../../application/ranking/dto/ranking.dto';
import { GetCurrentRankingsUseCase } from '../../../application/ranking/use-cases/get-current-rankings.use-case';
import { GetCurrentUserRankingUseCase } from '../../../application/ranking/use-cases/get-current-user-ranking.use-case';
import { RankingType } from '../../../domain/ranking/entities/ranking-snapshot.entity';

@ApiTags('Rankings')
@Controller('rankings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RankingController {
  constructor(
    private readonly getCurrentRankingsUseCase: GetCurrentRankingsUseCase,
    private readonly getCurrentUserRankingUseCase: GetCurrentUserRankingUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get user rankings' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of user rankings', 
    type: RankingListResponseDto 
  })
  async getRankings(@Query() queryDto: RankingListQueryDto): Promise<RankingListResponseDto> {
    const type = (queryDto.type && Object.values(RankingType).includes(queryDto.type as unknown as RankingType)) 
      ? queryDto.type as unknown as RankingType 
      : RankingType.CARBON_CREDITS;
    
    const result = await this.getCurrentRankingsUseCase.execute({
      type,
      limit: queryDto.limit,
      offset: queryDto.offset,
    });

    return {
      rankings: result.rankings,
      total: result.total,
      type: type as unknown as RankingTypeDto,
      period: queryDto.period || 'ALL_TIME' as RankingPeriodDto,
      hasNext: result.hasNext,
    };
  }

  @Get('my-stats')
  @ApiOperation({ summary: 'Get current user ranking statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Current user ranking statistics', 
    type: CurrentUserRankingDto 
  })
  async getCurrentUserRanking(@Request() req: any): Promise<CurrentUserRankingDto> {
    const userId = req.user.sub;
    
    const result = await this.getCurrentUserRankingUseCase.execute({
      userId,
      type: RankingType.CARBON_CREDITS,
    });

    return {
      currentRank: result.currentRank,
      currentScore: result.currentScore,
      previousRank: result.previousRank || result.currentRank,
      rankChange: result.rankChange || 0,
      scoreToNextRank: result.scoreToNextRank || 0,
      nextRankPosition: result.nextRankPosition || result.currentRank - 1,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get comprehensive ranking statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Comprehensive ranking statistics', 
    type: RankingStatsResponseDto 
  })
  async getRankingStats(@Request() req: any): Promise<RankingStatsResponseDto> {
    const userId = req.user.sub;
    
    const currentUserRanking = await this.getCurrentUserRankingUseCase.execute({
      userId,
      type: RankingType.CARBON_CREDITS,
    });

    const topCarbonUsers = await this.getCurrentRankingsUseCase.execute({
      type: RankingType.CARBON_CREDITS,
      limit: 3,
    });

    const topMissionUsers = await this.getCurrentRankingsUseCase.execute({
      type: RankingType.MISSIONS_COMPLETED,
      limit: 3,
    });

    const topCo2Users = await this.getCurrentRankingsUseCase.execute({
      type: RankingType.CO2_REDUCTION,
      limit: 3,
    });

    return {
      totalUsers: topCarbonUsers.total,
      currentUser: {
        currentRank: currentUserRanking.currentRank,
        currentScore: currentUserRanking.currentScore,
        previousRank: currentUserRanking.previousRank || currentUserRanking.currentRank,
        rankChange: currentUserRanking.rankChange || 0,
        scoreToNextRank: currentUserRanking.scoreToNextRank || 0,
        nextRankPosition: currentUserRanking.nextRankPosition || currentUserRanking.currentRank - 1,
      },
      topCarbonCreditUsers: topCarbonUsers.rankings.map(r => ({ ...r, isCurrentUser: r.userId === userId })),
      topMissionUsers: topMissionUsers.rankings.map(r => ({ ...r, isCurrentUser: r.userId === userId })),
      topCo2ReductionUsers: topCo2Users.rankings.map(r => ({ ...r, isCurrentUser: r.userId === userId })),
    };
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get comprehensive leaderboard' })
  @ApiResponse({ 
    status: 200, 
    description: 'Comprehensive leaderboard data', 
    type: LeaderboardResponseDto 
  })
  async getLeaderboard(@Request() req: any): Promise<LeaderboardResponseDto> {
    const userId = req.user.sub;
    
    const currentUserRanking = await this.getCurrentUserRankingUseCase.execute({
      userId,
      type: RankingType.CARBON_CREDITS,
    });

    const carbonRankings = await this.getCurrentRankingsUseCase.execute({
      type: RankingType.CARBON_CREDITS,
      limit: 10,
    });

    // For MVP, we'll use the same rankings for weekly, monthly, and all-time
    // In production, this would query different time periods
    const baseRanking = {
      rankings: carbonRankings.rankings.map(r => ({ ...r, isCurrentUser: r.userId === userId })),
      total: carbonRankings.total,
      type: 'CARBON_CREDITS' as any,
      hasNext: carbonRankings.hasNext,
    };

    return {
      weekly: {
        ...baseRanking,
        period: 'WEEKLY' as any,
      },
      monthly: {
        ...baseRanking,
        period: 'MONTHLY' as any,
      },
      allTime: {
        ...baseRanking,
        period: 'ALL_TIME' as any,
      },
      currentUserStats: {
        currentRank: currentUserRanking.currentRank,
        currentScore: currentUserRanking.currentScore,
        previousRank: currentUserRanking.previousRank || currentUserRanking.currentRank,
        rankChange: currentUserRanking.rankChange || 0,
        scoreToNextRank: currentUserRanking.scoreToNextRank || 0,
        nextRankPosition: currentUserRanking.nextRankPosition || currentUserRanking.currentRank - 1,
      },
    };
  }
}
