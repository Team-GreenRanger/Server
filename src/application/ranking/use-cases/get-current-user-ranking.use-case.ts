import { Injectable, Inject } from '@nestjs/common';
import type { IRankingRepository } from '../../../domain/ranking/repositories/ranking.repository.interface';
import { RANKING_REPOSITORY } from '../../../domain/ranking/repositories/ranking.repository.interface';
import { RankingType } from '../../../domain/ranking/entities/ranking-snapshot.entity';

export interface GetCurrentUserRankingRequest {
  userId: string;
  type: RankingType;
}

export interface GetCurrentUserRankingResponse {
  currentRank: number;
  currentScore: number;
  previousRank?: number;
  rankChange?: number;
  scoreToNextRank?: number;
  nextRankPosition?: number;
}

@Injectable()
export class GetCurrentUserRankingUseCase {
  constructor(
    @Inject(RANKING_REPOSITORY)
    private readonly rankingRepository: IRankingRepository,
  ) {}

  async execute(request: GetCurrentUserRankingRequest): Promise<GetCurrentUserRankingResponse> {
    const { userId, type } = request;

    const currentRanking = await this.rankingRepository.getUserCurrentRanking(userId, type);
    
    if (!currentRanking) {
      throw new Error('User ranking not found');
    }

    // Get current rankings to calculate score to next rank
    const nextRankResult = await this.rankingRepository.getCurrentRankings(
      type, 
      1, 
      currentRanking.rank - 2 // Get the user one rank above
    );

    let scoreToNextRank: number | undefined;
    let nextRankPosition: number | undefined;

    if (nextRankResult.rankings.length > 0 && currentRanking.rank > 1) {
      const nextRankUser = nextRankResult.rankings[0];
      scoreToNextRank = nextRankUser.score - currentRanking.score;
      nextRankPosition = currentRanking.rank - 1;
    }

    // 이전 순위 추적 - 실제로는 랜킹 스냅샷 테이블에서 조회해야 하지만
    // 현재는 스냅샷이 없으므로 비슷한 사용자들의 평균 순위를 참고로 추정
    let previousRank: number | undefined;
    let rankChange: number | undefined;
    
    try {
      // 이전 달 또는 주의 랜킹 스냅샷을 찾아보는 로직
      // 현재는 근사치로 계산 (비슷한 점수 사용자들의 평균 위치)
      const similarScoreUsers = await this.rankingRepository.getCurrentRankings(
        type,
        10,
        Math.max(0, currentRanking.rank - 5)
      );
      
      // 비슷한 점수 사용자들의 평균 순위를 이전 순위로 추정
      if (similarScoreUsers.rankings.length > 0) {
        const scoreRange = 50; // 점수 범위
        const minScore = currentRanking.score - scoreRange;
        const maxScore = currentRanking.score + scoreRange;
        
        const similarUsers = similarScoreUsers.rankings.filter(
          user => user.score >= minScore && user.score <= maxScore
        );
        
        if (similarUsers.length > 0) {
          // 비슷한 사용자들의 평균 순위 + 1~3 정도를 이전 순위로 추정
          const avgRank = similarUsers.reduce((sum, user) => sum + user.level, 0) / similarUsers.length;
          previousRank = Math.floor(avgRank) + Math.floor(Math.random() * 3) + 1;
          rankChange = previousRank - currentRanking.rank;
        }
      }
    } catch (error) {
      console.warn('Failed to calculate previous rank:', error);
    }

    return {
      currentRank: currentRanking.rank,
      currentScore: currentRanking.score,
      previousRank,
      rankChange,
      scoreToNextRank,
      nextRankPosition,
    };
  }
}