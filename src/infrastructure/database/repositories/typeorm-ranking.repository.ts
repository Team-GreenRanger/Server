import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RankingSnapshot, RankingType, RankingPeriod, RankingEntry } from '../../../domain/ranking/entities/ranking-snapshot.entity';
import { IRankingRepository, RankingData } from '../../../domain/ranking/repositories/ranking.repository.interface';

@Injectable()
export class TypeOrmRankingRepository implements IRankingRepository {
  async saveSnapshot(snapshot: RankingSnapshot): Promise<RankingSnapshot> {
    return snapshot;
  }

  async findSnapshotById(id: string): Promise<RankingSnapshot | null> {
    return null;
  }

  async findSnapshotByPeriod(type: RankingType, period: RankingPeriod, periodIdentifier: string): Promise<RankingSnapshot | null> {
    return null;
  }

  async findSnapshotsByType(type: RankingType, limit?: number): Promise<RankingSnapshot[]> {
    return [];
  }

  async getCurrentRankings(type: RankingType, limit?: number, offset?: number): Promise<{ rankings: RankingData[]; total: number }> {
    const mockRankings: RankingData[] = [
      {
        userId: 'user-1',
        userName: '김환경',
        profileImageUrl: 'https://example.com/avatar1.jpg',
        score: type === RankingType.CARBON_CREDITS ? 4500 : 25,
        level: 5
      },
      {
        userId: 'user-2',
        userName: '이지구',
        profileImageUrl: 'https://example.com/avatar2.jpg',
        score: type === RankingType.CARBON_CREDITS ? 4200 : 22,
        level: 4
      },
      {
        userId: 'user-3',
        userName: '박친환경',
        score: type === RankingType.CARBON_CREDITS ? 3800 : 18,
        level: 3
      },
    ];

    const total = mockRankings.length;
    const startIndex = offset || 0;
    const endIndex = startIndex + (limit || 10);
    const rankings = mockRankings.slice(startIndex, endIndex);

    return { rankings, total };
  }

  async getUserCurrentRanking(userId: string, type: RankingType): Promise<{ rank: number; score: number; totalUsers: number; } | null> {
    return {
      rank: 1,
      score: type === RankingType.CARBON_CREDITS ? 4600 : 28,
      totalUsers: 100
    };
  }

  async deleteSnapshot(id: string): Promise<void> {
    return;
  }

  async getUserRanking(userId: string, type: RankingType): Promise<RankingSnapshot | null> {
    const rankings = [
      RankingEntry.create({
        rank: 1,
        userId,
        userName: '사용자',
        score: type === RankingType.CARBON_CREDITS ? 4600 : 28,
        level: 5
      })
    ];

    return RankingSnapshot.create({
      type,
      period: RankingPeriod.ALL_TIME,
      periodIdentifier: 'all-time',
      rankings,
      totalUsers: 1
    });
  }

  async getUserRankingHistory(userId: string, type: RankingType): Promise<RankingSnapshot[]> {
    const rankings = [
      RankingEntry.create({
        rank: 1,
        userId,
        userName: '사용자',
        score: type === RankingType.CARBON_CREDITS ? 4600 : 28,
        level: 5
      })
    ];

    return [
      RankingSnapshot.create({
        type,
        period: RankingPeriod.ALL_TIME,
        periodIdentifier: 'all-time',
        rankings,
        totalUsers: 1
      })
    ];
  }

  async save(ranking: RankingSnapshot): Promise<RankingSnapshot> {
    return ranking;
  }

  async findByUserIdAndType(userId: string, type: RankingType): Promise<RankingSnapshot | null> {
    return this.getUserRanking(userId, type);
  }

  async findTopRankings(type: RankingType, limit: number): Promise<RankingSnapshot[]> {
    const result = await this.getUserRankingHistory('user-1', type);
    return result;
  }
}
