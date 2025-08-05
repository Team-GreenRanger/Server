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
  RankingPeriodDto,
  RankingScopeDto
} from '../../../application/ranking/dto/ranking.dto';
import { GetCurrentRankingsUseCase } from '../../../application/ranking/use-cases/get-current-rankings.use-case';
import { GetCurrentUserRankingUseCase } from '../../../application/ranking/use-cases/get-current-user-ranking.use-case';
import { RankingType, RankingPeriod, RankingScope } from '../../../domain/ranking/entities/ranking-snapshot.entity';
import type { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../../../domain/user/repositories/user.repository.interface';
import { Inject } from '@nestjs/common';

@ApiTags('Rankings')
@Controller('rankings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RankingController {
  constructor(
    private readonly getCurrentRankingsUseCase: GetCurrentRankingsUseCase,
    private readonly getCurrentUserRankingUseCase: GetCurrentUserRankingUseCase,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get monthly user rankings' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of monthly user rankings', 
    type: RankingListResponseDto 
  })
  async getRankings(@Query() queryDto: RankingListQueryDto, @Request() req: any): Promise<RankingListResponseDto> {
    const userId = req.user.sub;
    const user = await this.userRepository.findById(userId);
    
    const type = (queryDto.type && Object.values(RankingType).includes(queryDto.type as unknown as RankingType)) 
      ? queryDto.type as unknown as RankingType 
      : RankingType.CARBON_CREDITS;
      
    const scope = (queryDto.scope && Object.values(RankingScope).includes(queryDto.scope as unknown as RankingScope))
      ? queryDto.scope as unknown as RankingScope
      : RankingScope.GLOBAL;
    
    const result = await this.getCurrentRankingsUseCase.execute({
      type,
      period: RankingPeriod.MONTHLY, // 고정: 월별 랭킹만 사용
      scope,
      nationality: scope === RankingScope.LOCAL ? user?.nationality : undefined,
      limit: queryDto.limit,
      offset: queryDto.offset,
    });

    return {
      rankings: result.rankings,
      total: result.total,
      type: type as unknown as RankingTypeDto,
      period: 'MONTHLY' as unknown as RankingPeriodDto,
      scope: scope as unknown as RankingScopeDto,
      hasNext: result.hasNext,
    };
  }

  @Get('my-stats')
  @ApiOperation({ summary: 'Get current user monthly ranking statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Current user monthly ranking statistics', 
    type: CurrentUserRankingDto 
  })
  async getCurrentUserRanking(@Request() req: any, @Query() queryDto: RankingListQueryDto): Promise<CurrentUserRankingDto> {
    const userId = req.user.sub;
    const user = await this.userRepository.findById(userId);
    
    const scope = (queryDto.scope && Object.values(RankingScope).includes(queryDto.scope as unknown as RankingScope))
      ? queryDto.scope as unknown as RankingScope
      : RankingScope.GLOBAL;
    
    const result = await this.getCurrentUserRankingUseCase.execute({
      userId,
      type: RankingType.CARBON_CREDITS,
      period: RankingPeriod.MONTHLY, // 고정: 월별 랭킹만 사용
      scope,
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
    const user = await this.userRepository.findById(userId);
    
    const currentUserRanking = await this.getCurrentUserRankingUseCase.execute({
      userId,
      type: RankingType.CARBON_CREDITS,
      period: RankingPeriod.ALL_TIME,
      scope: RankingScope.GLOBAL,
    });

    const topCarbonUsers = await this.getCurrentRankingsUseCase.execute({
      type: RankingType.CARBON_CREDITS,
      period: RankingPeriod.ALL_TIME,
      scope: RankingScope.GLOBAL,
      limit: 3,
    });

    const topMissionUsers = await this.getCurrentRankingsUseCase.execute({
      type: RankingType.MISSIONS_COMPLETED,
      period: RankingPeriod.ALL_TIME,
      scope: RankingScope.GLOBAL,
      limit: 3,
    });

    const topCo2Users = await this.getCurrentRankingsUseCase.execute({
      type: RankingType.CO2_REDUCTION,
      period: RankingPeriod.ALL_TIME,
      scope: RankingScope.GLOBAL,
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
  @ApiOperation({ summary: 'Get monthly leaderboard (resets on 1st of each month)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Monthly leaderboard data', 
    type: LeaderboardResponseDto 
  })
  async getLeaderboard(@Request() req: any): Promise<LeaderboardResponseDto> {
    const userId = req.user.sub;
    const user = await this.userRepository.findById(userId);
    
    const createRankingResponse = async (scope: RankingScope) => {
      const rankings = await this.getCurrentRankingsUseCase.execute({
        type: RankingType.CARBON_CREDITS,
        period: RankingPeriod.MONTHLY,
        scope,
        nationality: scope === RankingScope.LOCAL ? user?.nationality : undefined,
        limit: 50, // 월별 랭킹이므로 더 많이 표시
      });
      
      return {
        rankings: rankings.rankings.map(r => ({ ...r, isCurrentUser: r.userId === userId })),
        total: rankings.total,
        type: 'CARBON_CREDITS' as any,
        period: 'MONTHLY' as any,
        scope: scope as any,
        hasNext: rankings.hasNext,
      };
    };

    const currentUserRanking = await this.getCurrentUserRankingUseCase.execute({
      userId,
      type: RankingType.CARBON_CREDITS,
      period: RankingPeriod.MONTHLY,
      scope: RankingScope.GLOBAL, // 현재 사용자 통계는 글로벌 기준
    });

    // 월별 랭킹만 제공 (기존 구조 유지를 위해 다른 필드들은 빈 데이터로 채움)
    const emptyRanking = {
      rankings: [],
      total: 0,
      type: 'CARBON_CREDITS' as any,
      period: 'WEEKLY' as any,
      scope: 'GLOBAL' as any,
      hasNext: false,
    };

    return {
      localWeekly: emptyRanking,
      localMonthly: await createRankingResponse(RankingScope.LOCAL),
      localAllTime: emptyRanking,
      globalWeekly: emptyRanking,
      globalMonthly: await createRankingResponse(RankingScope.GLOBAL),
      globalAllTime: emptyRanking,
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
