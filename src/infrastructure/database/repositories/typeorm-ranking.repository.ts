import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RankingSnapshot, RankingType, RankingPeriod, RankingScope, RankingEntry } from '../../../domain/ranking/entities/ranking-snapshot.entity';
import { IRankingRepository, RankingData, RankingQuery } from '../../../domain/ranking/repositories/ranking.repository.interface';
import { UserEntity } from '../entities/user.entity';
import { CarbonCreditEntity } from '../entities/carbon-credit.entity';
import { UserMissionEntity, UserMissionStatusEntity } from '../entities/user-mission.entity';
import { MissionEntity } from '../entities/mission.entity';
import { maskUserName, getPeriodDateFilter } from '../../../shared/utils/ranking.utils';

@Injectable()
export class TypeOrmRankingRepository implements IRankingRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(CarbonCreditEntity)
    private readonly carbonCreditRepository: Repository<CarbonCreditEntity>,
    @InjectRepository(UserMissionEntity)
    private readonly userMissionRepository: Repository<UserMissionEntity>,
    @InjectRepository(MissionEntity)
    private readonly missionRepository: Repository<MissionEntity>,
  ) {}

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

  async getCurrentRankings(query: RankingQuery): Promise<{ rankings: RankingData[]; total: number }> {
    const { type, period, scope, nationality, limit = 10, offset = 0 } = query;
    const dateFilter = getPeriodDateFilter(period);
    
    let rankings: RankingData[] = [];
    let total = 0;

    switch (type) {
      case RankingType.CARBON_CREDITS:
        const carbonQuery = this.carbonCreditRepository
          .createQueryBuilder('cc')
          .innerJoin('cc.user', 'user')
          .select([
            'user.id as userId',
            'user.name as userName', 
            'user.profileImageUrl as profileImageUrl',
            'user.nationality as nationality',
            'COALESCE(cc.totalEarned, 0) as score'
          ])
          .where('user.isActive = :isActive', { isActive: true });

        if (scope === RankingScope.LOCAL && nationality) {
          carbonQuery.andWhere('user.nationality = :nationality', { nationality });
        }

        const carbonRankings = await carbonQuery
          .orderBy('COALESCE(cc.totalEarned, 0)', 'DESC')
          .addOrderBy('user.createdAt', 'ASC')
          .offset(offset)
          .limit(limit)
          .getRawMany();

        const carbonTotalQuery = this.carbonCreditRepository
          .createQueryBuilder('cc')
          .innerJoin('cc.user', 'user')
          .where('user.isActive = :isActive', { isActive: true });

        if (scope === RankingScope.LOCAL && nationality) {
          carbonTotalQuery.andWhere('user.nationality = :nationality', { nationality });
        }

        total = await carbonTotalQuery.getCount();
        rankings = carbonRankings.map(r => ({
          ...r,
          userName: maskUserName(r.userName),
          score: parseFloat(r.score) || 0
        }));
        break;

      case RankingType.MISSIONS_COMPLETED:
        const missionQuery = this.userMissionRepository
          .createQueryBuilder('um')
          .innerJoin('um.user', 'user')
          .select([
            'user.id as userId',
            'user.name as userName',
            'user.profileImageUrl as profileImageUrl',
            'user.nationality as nationality',
            'COUNT(um.id) as score'
          ])
          .where('um.status = :status', { status: UserMissionStatusEntity.COMPLETED })
          .andWhere('user.isActive = :isActive', { isActive: true });

        if (dateFilter.startDate) {
          missionQuery.andWhere('um.completedAt >= :startDate', { startDate: dateFilter.startDate });
        }

        if (scope === RankingScope.LOCAL && nationality) {
          missionQuery.andWhere('user.nationality = :nationality', { nationality });
        }

        const missionRankings = await missionQuery
          .groupBy('user.id, user.name, user.profileImageUrl, user.nationality')
          .orderBy('COUNT(um.id)', 'DESC')
          .addOrderBy('user.createdAt', 'ASC')
          .offset(offset)
          .limit(limit)
          .getRawMany();

        const missionTotalQuery = this.userRepository
          .createQueryBuilder('user')
          .where('user.isActive = :isActive', { isActive: true });

        if (scope === RankingScope.LOCAL && nationality) {
          missionTotalQuery.andWhere('user.nationality = :nationality', { nationality });
        }

        total = await missionTotalQuery.getCount();
        rankings = missionRankings.map(r => ({
          ...r,
          userName: maskUserName(r.userName),
          score: parseInt(r.score) || 0
        }));
        break;

      case RankingType.CO2_REDUCTION:
        const co2Query = this.userMissionRepository
          .createQueryBuilder('um')
          .innerJoin('um.user', 'user')
          .innerJoin('um.mission', 'mission')
          .select([
            'user.id as userId',
            'user.name as userName',
            'user.profileImageUrl as profileImageUrl',
            'user.nationality as nationality',
            'SUM(mission.co2ReductionAmount) as score'
          ])
          .where('um.status = :status', { status: UserMissionStatusEntity.COMPLETED })
          .andWhere('user.isActive = :isActive', { isActive: true });

        if (dateFilter.startDate) {
          co2Query.andWhere('um.completedAt >= :startDate', { startDate: dateFilter.startDate });
        }

        if (scope === RankingScope.LOCAL && nationality) {
          co2Query.andWhere('user.nationality = :nationality', { nationality });
        }

        const co2Rankings = await co2Query
          .groupBy('user.id, user.name, user.profileImageUrl, user.nationality')
          .orderBy('SUM(mission.co2ReductionAmount)', 'DESC')
          .addOrderBy('user.createdAt', 'ASC')
          .offset(offset)
          .limit(limit)
          .getRawMany();

        const co2TotalQuery = this.userRepository
          .createQueryBuilder('user')
          .where('user.isActive = :isActive', { isActive: true });

        if (scope === RankingScope.LOCAL && nationality) {
          co2TotalQuery.andWhere('user.nationality = :nationality', { nationality });
        }

        total = await co2TotalQuery.getCount();
        rankings = co2Rankings.map(r => ({
          ...r,
          userName: maskUserName(r.userName),
          score: parseFloat(r.score) || 0
        }));
        break;
    }

    return { rankings, total };
  }

  async getUserCurrentRanking(userId: string, type: RankingType, period: RankingPeriod, scope: RankingScope): Promise<{ rank: number; score: number; totalUsers: number; } | null> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return null;

    const dateFilter = getPeriodDateFilter(period);
    let userScore = 0;
    let totalUsers = 0;
    let rank = 1;

    switch (type) {
      case RankingType.CARBON_CREDITS:
        const carbonCredit = await this.carbonCreditRepository.findOne({
          where: { userId },
          relations: ['user']
        });
        
        userScore = carbonCredit?.totalEarned || 0;
        
        const higherCarbonQuery = this.carbonCreditRepository
          .createQueryBuilder('cc')
          .innerJoin('cc.user', 'user')
          .where('COALESCE(cc.totalEarned, 0) > :userScore', { userScore })
          .andWhere('user.isActive = :isActive', { isActive: true });

        if (scope === RankingScope.LOCAL && user.nationality) {
          higherCarbonQuery.andWhere('user.nationality = :nationality', { nationality: user.nationality });
        }
        
        rank = await higherCarbonQuery.getCount() + 1;
        
        const totalCarbonQuery = this.carbonCreditRepository
          .createQueryBuilder('cc')
          .innerJoin('cc.user', 'user')
          .where('user.isActive = :isActive', { isActive: true });

        if (scope === RankingScope.LOCAL && user.nationality) {
          totalCarbonQuery.andWhere('user.nationality = :nationality', { nationality: user.nationality });
        }

        totalUsers = await totalCarbonQuery.getCount();
        break;

      case RankingType.MISSIONS_COMPLETED:
        const userMissionsQuery = this.userMissionRepository
          .createQueryBuilder('um')
          .innerJoin('um.user', 'user')
          .where('um.userId = :userId', { userId })
          .andWhere('um.status = :status', { status: UserMissionStatusEntity.COMPLETED })
          .andWhere('user.isActive = :isActive', { isActive: true });

        if (dateFilter.startDate) {
          userMissionsQuery.andWhere('um.completedAt >= :startDate', { startDate: dateFilter.startDate });
        }
        
        userScore = await userMissionsQuery.getCount();
        
        const higherMissionQuery = this.userMissionRepository
          .createQueryBuilder('um')
          .innerJoin('um.user', 'user')
          .select('COUNT(um.id) as missionCount')
          .where('um.status = :status', { status: UserMissionStatusEntity.COMPLETED })
          .andWhere('user.isActive = :isActive', { isActive: true });

        if (dateFilter.startDate) {
          higherMissionQuery.andWhere('um.completedAt >= :startDate', { startDate: dateFilter.startDate });
        }

        if (scope === RankingScope.LOCAL && user.nationality) {
          higherMissionQuery.andWhere('user.nationality = :nationality', { nationality: user.nationality });
        }
        
        const higherMissionUsers = await higherMissionQuery
          .groupBy('user.id')
          .having('COUNT(um.id) > :userScore', { userScore })
          .getCount();
        
        rank = higherMissionUsers + 1;
        
        const totalMissionQuery = this.userRepository
          .createQueryBuilder('user')
          .where('user.isActive = :isActive', { isActive: true });

        if (scope === RankingScope.LOCAL && user.nationality) {
          totalMissionQuery.andWhere('user.nationality = :nationality', { nationality: user.nationality });
        }

        totalUsers = await totalMissionQuery.getCount();
        break;

      case RankingType.CO2_REDUCTION:
        const userCo2Query = this.userMissionRepository
          .createQueryBuilder('um')
          .innerJoin('um.user', 'user')
          .innerJoin('um.mission', 'mission')
          .select('SUM(mission.co2ReductionAmount) as totalReduction')
          .where('um.userId = :userId', { userId })
          .andWhere('um.status = :status', { status: UserMissionStatusEntity.COMPLETED })
          .andWhere('user.isActive = :isActive', { isActive: true });

        if (dateFilter.startDate) {
          userCo2Query.andWhere('um.completedAt >= :startDate', { startDate: dateFilter.startDate });
        }
        
        const userCo2Reduction = await userCo2Query.getRawOne();
        userScore = parseFloat(userCo2Reduction?.totalReduction) || 0;
        
        const higherCo2Query = this.userMissionRepository
          .createQueryBuilder('um')
          .innerJoin('um.user', 'user')
          .innerJoin('um.mission', 'mission')
          .select('SUM(mission.co2ReductionAmount) as totalReduction')
          .where('um.status = :status', { status: UserMissionStatusEntity.COMPLETED })
          .andWhere('user.isActive = :isActive', { isActive: true });

        if (dateFilter.startDate) {
          higherCo2Query.andWhere('um.completedAt >= :startDate', { startDate: dateFilter.startDate });
        }

        if (scope === RankingScope.LOCAL && user.nationality) {
          higherCo2Query.andWhere('user.nationality = :nationality', { nationality: user.nationality });
        }
        
        const higherCo2Users = await higherCo2Query
          .groupBy('user.id')
          .having('SUM(mission.co2ReductionAmount) > :userScore', { userScore })
          .getCount();
        
        rank = higherCo2Users + 1;
        
        const totalCo2Query = this.userRepository
          .createQueryBuilder('user')
          .where('user.isActive = :isActive', { isActive: true });

        if (scope === RankingScope.LOCAL && user.nationality) {
          totalCo2Query.andWhere('user.nationality = :nationality', { nationality: user.nationality });
        }

        totalUsers = await totalCo2Query.getCount();
        break;
    }

    return { rank, score: userScore, totalUsers };
  }

  async deleteSnapshot(id: string): Promise<void> {
    return;
  }

  async getUserRanking(userId: string, type: RankingType): Promise<RankingSnapshot | null> {
    const userRanking = await this.getUserCurrentRanking(userId, type, RankingPeriod.ALL_TIME, RankingScope.GLOBAL);
    if (!userRanking) return null;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return null;

    const rankings = [
      RankingEntry.create({
        rank: userRanking.rank,
        userId,
        userName: user.name,
        profileImageUrl: user.profileImageUrl,
        score: userRanking.score,
        level: 1
      })
    ];

    return RankingSnapshot.create({
      type,
      period: RankingPeriod.ALL_TIME,
      periodIdentifier: 'all-time',
      rankings,
      totalUsers: userRanking.totalUsers
    });
  }

  async getUserRankingHistory(userId: string, type: RankingType): Promise<RankingSnapshot[]> {
    const current = await this.getUserRanking(userId, type);
    return current ? [current] : [];
  }

  async save(ranking: RankingSnapshot): Promise<RankingSnapshot> {
    return ranking;
  }

  async findByUserIdAndType(userId: string, type: RankingType): Promise<RankingSnapshot | null> {
    return this.getUserRanking(userId, type);
  }

  async findTopRankings(type: RankingType, limit: number): Promise<RankingSnapshot[]> {
    const query: RankingQuery = {
      type,
      period: RankingPeriod.ALL_TIME,
      scope: RankingScope.GLOBAL,
      limit
    };
    
    const result = await this.getCurrentRankings(query);
    const rankings = result.rankings.map((ranking, index) => 
      RankingEntry.create({
        rank: index + 1,
        userId: ranking.userId,
        userName: ranking.userName,
        profileImageUrl: ranking.profileImageUrl,
        score: ranking.score,
        level: 1
      })
    );

    if (rankings.length === 0) return [];

    return [RankingSnapshot.create({
      type,
      period: RankingPeriod.ALL_TIME,
      periodIdentifier: 'all-time',
      rankings,
      totalUsers: result.total
    })];
  }
}