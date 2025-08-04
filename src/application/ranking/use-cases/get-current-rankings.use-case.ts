import { Injectable, Inject } from '@nestjs/common';
import type { IRankingRepository, RankingData } from '../../../domain/ranking/repositories/ranking.repository.interface';
import { RANKING_REPOSITORY } from '../../../domain/ranking/repositories/ranking.repository.interface';
import { RankingType } from '../../../domain/ranking/entities/ranking-snapshot.entity';

export interface GetCurrentRankingsRequest {
  type: RankingType;
  limit?: number;
  offset?: number;
}

export interface RankingEntry {
  rank: number;
  userId: string;
  userName: string;
  profileImageUrl?: string;
  score: number;
  isCurrentUser: boolean;
}

export interface GetCurrentRankingsResponse {
  rankings: RankingEntry[];
  total: number;
  hasNext: boolean;
}

@Injectable()
export class GetCurrentRankingsUseCase {
  constructor(
    @Inject(RANKING_REPOSITORY)
    private readonly rankingRepository: IRankingRepository,
  ) {}

  async execute(request: GetCurrentRankingsRequest): Promise<GetCurrentRankingsResponse> {
    const { type, limit = 10, offset = 0 } = request;

    const result = await this.rankingRepository.getCurrentRankings(type, limit, offset);

    const rankings: RankingEntry[] = result.rankings.map((ranking, index) => ({
      rank: offset + index + 1,
      userId: ranking.userId,
      userName: ranking.userName,
      profileImageUrl: ranking.profileImageUrl,
      score: ranking.score,
      isCurrentUser: false,
    }));

    const hasNext = offset + limit < result.total;

    return {
      rankings,
      total: result.total,
      hasNext,
    };
  }
}