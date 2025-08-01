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
  CurrentUserRankingDto
} from '../../../application/ranking/dto/ranking.dto';

@ApiTags('Rankings')
@Controller('rankings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RankingController {
  constructor() {}

  @Get()
  @ApiOperation({ summary: 'Get user rankings' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of user rankings', 
    type: RankingListResponseDto 
  })
  async getRankings(@Query() queryDto: RankingListQueryDto): Promise<RankingListResponseDto> {
    // TODO: Implement get rankings use case
    
    // Mock data for now
    return {
      rankings: [
        {
          rank: 1,
          userId: 'user-1',
          userName: '김환경',
          profileImageUrl: 'https://example.com/avatar1.jpg',
          score: 5200,
          level: 5,
          isCurrentUser: false,
        },
        {
          rank: 2,
          userId: 'user-2',
          userName: '이지구',
          profileImageUrl: 'https://example.com/avatar2.jpg',
          score: 4800,
          level: 4,
          isCurrentUser: false,
        },
        {
          rank: 3,
          userId: 'user-3',
          userName: '박자연',
          score: 4400,
          level: 4,
          isCurrentUser: true,
        },
      ],
      total: 1000,
      type: queryDto.type || 'CARBON_CREDITS' as any,
      period: queryDto.period || 'ALL_TIME' as any,
      hasNext: true,
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
    // TODO: Implement get current user ranking use case
    const userId = req.user.sub;
    
    return {
      currentRank: 3,
      currentScore: 4400,
      previousRank: 5,
      rankChange: 2, // Improved by 2 positions
      scoreToNextRank: 400,
      nextRankPosition: 2,
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
    // TODO: Implement get ranking stats use case
    const userId = req.user.sub;
    
    return {
      totalUsers: 1000,
      currentUser: {
        currentRank: 3,
        currentScore: 4400,
        previousRank: 5,
        rankChange: 2,
        scoreToNextRank: 400,
        nextRankPosition: 2,
      },
      topCarbonCreditUsers: [
        {
          rank: 1,
          userId: 'user-1',
          userName: '김환경',
          profileImageUrl: 'https://example.com/avatar1.jpg',
          score: 5200,
          level: 5,
          isCurrentUser: false,
        },
        {
          rank: 2,
          userId: 'user-2',
          userName: '이지구',
          profileImageUrl: 'https://example.com/avatar2.jpg',
          score: 4800,
          level: 4,
          isCurrentUser: false,
        },
        {
          rank: 3,
          userId: userId,
          userName: '박자연',
          score: 4400,
          level: 4,
          isCurrentUser: true,
        },
      ],
      topMissionUsers: [
        {
          rank: 1,
          userId: 'user-4',
          userName: '최미션',
          score: 45, // Number of missions completed
          level: 4,
          isCurrentUser: false,
        },
        {
          rank: 2,
          userId: 'user-5',
          userName: '정완수',
          score: 42,
          level: 4,
          isCurrentUser: false,
        },
        {
          rank: 3,
          userId: 'user-6',
          userName: '한실천',
          score: 38,
          level: 3,
          isCurrentUser: false,
        },
      ],
      topCo2ReductionUsers: [
        {
          rank: 1,
          userId: 'user-7',
          userName: '송탄소',
          score: 245.8, // CO2 reduction in kg
          level: 5,
          isCurrentUser: false,
        },
        {
          rank: 2,
          userId: 'user-8',
          userName: '윤감축',
          score: 198.5,
          level: 4,
          isCurrentUser: false,
        },
        {
          rank: 3,
          userId: 'user-9',
          userName: '강절약',
          score: 175.2,
          level: 4,
          isCurrentUser: false,
        },
      ],
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
    // TODO: Implement get leaderboard use case
    const userId = req.user.sub;
    
    const mockRankings = [
      {
        rank: 1,
        userId: 'user-1',
        userName: '김환경',
        profileImageUrl: 'https://example.com/avatar1.jpg',
        score: 5200,
        level: 5,
        isCurrentUser: false,
      },
      {
        rank: 2,
        userId: 'user-2',
        userName: '이지구',
        profileImageUrl: 'https://example.com/avatar2.jpg',
        score: 4800,
        level: 4,
        isCurrentUser: false,
      },
      {
        rank: 3,
        userId: userId,
        userName: '박자연',
        score: 4400,
        level: 4,
        isCurrentUser: true,
      },
    ];

    return {
      weekly: {
        rankings: mockRankings,
        total: 1000,
        type: 'CARBON_CREDITS' as any,
        period: 'WEEKLY' as any,
        hasNext: true,
      },
      monthly: {
        rankings: mockRankings,
        total: 1000,
        type: 'CARBON_CREDITS' as any,
        period: 'MONTHLY' as any,
        hasNext: true,
      },
      allTime: {
        rankings: mockRankings,
        total: 1000,
        type: 'CARBON_CREDITS' as any,
        period: 'ALL_TIME' as any,
        hasNext: true,
      },
      currentUserStats: {
        currentRank: 3,
        currentScore: 4400,
        previousRank: 5,
        rankChange: 2,
        scoreToNextRank: 400,
        nextRankPosition: 2,
      },
    };
  }
}
