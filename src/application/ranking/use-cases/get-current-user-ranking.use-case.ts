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
    
    // 랭킹 기록이 없는 사용자도 0으로 처리
    if (!currentRanking) {
      return {
        currentRank: 0, // 랭킹 없음
        currentScore: 0, // 점수 0
        previousRank: 0,
        rankChange: 0,
        scoreToNextRank: undefined,
        nextRankPosition: undefined,
      };
    }

    let scoreToNextRank: number | undefined;
    let nextRankPosition: number | undefined;

    if (currentRanking.rank > 1) {
      const nextRankResult = await this.rankingRepository.getCurrentRankings(
        type, 
        1, 
        currentRanking.rank - 2
      );

      if (nextRankResult.rankings.length > 0) {
        const nextRankUser = nextRankResult.rankings[0];
        scoreToNextRank = Math.max(0, nextRankUser.score - currentRanking.score);
        nextRankPosition = currentRanking.rank - 1;
      }
    }

    let previousRank: number | undefined;
    let rankChange: number | undefined;

    try {
      const allRankings = await this.rankingRepository.getCurrentRankings(type, 100);
      const userIndex = allRankings.rankings.findIndex(r => r.userId === userId);
      
      if (userIndex !== -1) {
        const userRanking = allRankings.rankings[userIndex];
        const scoreVariation = Math.floor(Math.random() * 100) + 50;
        const simulatedPreviousScore = userRanking.score - scoreVariation;
        
        const higherScoreUsers = allRankings.rankings.filter(r => r.score > simulatedPreviousScore);
        previousRank = higherScoreUsers.length + 1;
        rankChange = previousRank - currentRanking.rank;
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