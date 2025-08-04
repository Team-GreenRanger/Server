import { RankingSnapshot, RankingType, RankingPeriod, RankingEntry } from '../entities/ranking-snapshot.entity';

export interface RankingData {
  userId: string;
  userName: string;
  profileImageUrl?: string;
  score: number;
}

export interface IRankingRepository {
  saveSnapshot(snapshot: RankingSnapshot): Promise<RankingSnapshot>;
  findSnapshotById(id: string): Promise<RankingSnapshot | null>;
  findSnapshotByPeriod(
    type: RankingType,
    period: RankingPeriod,
    periodIdentifier: string
  ): Promise<RankingSnapshot | null>;
  findSnapshotsByType(type: RankingType, limit?: number): Promise<RankingSnapshot[]>;
  getCurrentRankings(type: RankingType, limit?: number, offset?: number): Promise<{
    rankings: RankingData[];
    total: number;
  }>;
  getUserCurrentRanking(userId: string, type: RankingType): Promise<{
    rank: number;
    score: number;
    totalUsers: number;
  } | null>;
  deleteSnapshot(id: string): Promise<void>;
}

export const RANKING_REPOSITORY = Symbol('RANKING_REPOSITORY');