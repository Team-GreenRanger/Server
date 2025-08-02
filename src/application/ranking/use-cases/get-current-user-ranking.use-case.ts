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

    // TODO: Implement previous rank tracking from ranking snapshots
    // For now, we'll return mock data for previous rank
    const previousRank = currentRanking.rank + 2; // Mock: assume user improved by 2 positions
    const rankChange = previousRank - currentRanking.rank;

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