import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RankingSnapshot, RankingType, RankingPeriod, RankingEntry } from '../../../domain/ranking/entities/ranking-snapshot.entity';
import { IRankingRepository, RankingData } from '../../../domain/ranking/repositories/ranking.repository.interface';
import { UserEntity } from '../entities/user.entity';
import { CarbonCreditEntity } from '../entities/carbon-credit.entity';
import { UserMissionEntity, UserMissionStatusEntity } from '../entities/user-mission.entity';
import { MissionEntity } from '../entities/mission.entity';

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

  async getCurrentRankings(type: RankingType, limit: number = 10, offset: number = 0): Promise<{ rankings: RankingData[]; total: number }> {
    let rankings: RankingData[] = [];
    let total = 0;

    switch (type) {
      case RankingType.CARBON_CREDITS:
        const carbonRankings = await this.carbonCreditRepository
          .createQueryBuilder('cc')
          .innerJoin('cc.user', 'user')
          .select([
            'user.id as userId',
            'user.name as userName', 
            'user.profileImageUrl as profileImageUrl',
            'cc.totalEarned as score'
          ])
          .where('user.isActive = :isActive', { isActive: true })
          .orderBy('cc.totalEarned', 'DESC')
          .offset(offset)
          .limit(limit)
          .getRawMany();

        const carbonTotal = await this.carbonCreditRepository
          .createQueryBuilder('cc')
          .innerJoin('cc.user', 'user')
          .where('user.isActive = :isActive', { isActive: true })
          .getCount();

        rankings = carbonRankings;
        total = carbonTotal;
        break;

      case RankingType.MISSIONS_COMPLETED:
        const missionRankings = await this.userMissionRepository
          .createQueryBuilder('um')
          .innerJoin('um.user', 'user')
          .select([
            'user.id as userId',
            'user.name as userName',
            'user.profileImageUrl as profileImageUrl',
            'COUNT(um.id) as score'
          ])
          .where('um.status = :status', { status: UserMissionStatusEntity.COMPLETED })
          .andWhere('user.isActive = :isActive', { isActive: true })
          .groupBy('user.id, user.name, user.profileImageUrl')
          .orderBy('COUNT(um.id)', 'DESC')
          .offset(offset)
          .limit(limit)
          .getRawMany();

        const missionTotal = await this.userMissionRepository
          .createQueryBuilder('um')
          .innerJoin('um.user', 'user')
          .select('user.id')
          .where('um.status = :status', { status: UserMissionStatusEntity.COMPLETED })
          .andWhere('user.isActive = :isActive', { isActive: true })
          .groupBy('user.id')
          .getCount();

        rankings = missionRankings.map(r => ({
          ...r,
          score: parseInt(r.score)
        }));
        total = missionTotal;
        break;

      case RankingType.CO2_REDUCTION:
        const co2Rankings = await this.userMissionRepository
          .createQueryBuilder('um')
          .innerJoin('um.user', 'user')
          .innerJoin('um.mission', 'mission')
          .select([
            'user.id as userId',
            'user.name as userName',
            'user.profileImageUrl as profileImageUrl',
            'SUM(mission.co2ReductionAmount) as score'
          ])
          .where('um.status = :status', { status: UserMissionStatusEntity.COMPLETED })
          .andWhere('user.isActive = :isActive', { isActive: true })
          .groupBy('user.id, user.name, user.profileImageUrl')
          .orderBy('SUM(mission.co2ReductionAmount)', 'DESC')
          .offset(offset)
          .limit(limit)
          .getRawMany();

        const co2Total = await this.userMissionRepository
          .createQueryBuilder('um')
          .innerJoin('um.user', 'user')
          .innerJoin('um.mission', 'mission')
          .select('user.id')
          .where('um.status = :status', { status: UserMissionStatusEntity.COMPLETED })
          .andWhere('user.isActive = :isActive', { isActive: true })
          .groupBy('user.id')
          .getCount();

        rankings = co2Rankings.map(r => ({
          ...r,
          score: parseFloat(r.score) || 0
        }));
        total = co2Total;
        break;
    }

    return { rankings, total };
  }

  async getUserCurrentRanking(userId: string, type: RankingType): Promise<{ rank: number; score: number; totalUsers: number; } | null> {
    let userScore = 0;
    let totalUsers = 0;
    let rank = 1;

    switch (type) {
      case RankingType.CARBON_CREDITS:
        const carbonCredit = await this.carbonCreditRepository.findOne({
          where: { userId },
          relations: ['user']
        });
        
        if (!carbonCredit) return null;
        
        userScore = carbonCredit.totalEarned;
        
        const higherCarbonUsers = await this.carbonCreditRepository
          .createQueryBuilder('cc')
          .innerJoin('cc.user', 'user')
          .where('cc.totalEarned > :userScore', { userScore })
          .andWhere('user.isActive = :isActive', { isActive: true })
          .getCount();
        
        rank = higherCarbonUsers + 1;
        
        totalUsers = await this.carbonCreditRepository
          .createQueryBuilder('cc')
          .innerJoin('cc.user', 'user')
          .where('user.isActive = :isActive', { isActive: true })
          .getCount();
        break;

      case RankingType.MISSIONS_COMPLETED:
        const userMissionsCount = await this.userMissionRepository
          .createQueryBuilder('um')
          .innerJoin('um.user', 'user')
          .where('um.userId = :userId', { userId })
          .andWhere('um.status = :status', { status: UserMissionStatusEntity.COMPLETED })
          .andWhere('user.isActive = :isActive', { isActive: true })
          .getCount();
        
        userScore = userMissionsCount;
        
        const higherMissionUsers = await this.userMissionRepository
          .createQueryBuilder('um')
          .innerJoin('um.user', 'user')
          .select('COUNT(um.id) as missionCount')
          .where('um.status = :status', { status: UserMissionStatusEntity.COMPLETED })
          .andWhere('user.isActive = :isActive', { isActive: true })
          .groupBy('user.id')
          .having('COUNT(um.id) > :userScore', { userScore })
          .getCount();
        
        rank = higherMissionUsers + 1;
        
        totalUsers = await this.userMissionRepository
          .createQueryBuilder('um')
          .innerJoin('um.user', 'user')
          .select('user.id')
          .where('um.status = :status', { status: UserMissionStatusEntity.COMPLETED })
          .andWhere('user.isActive = :isActive', { isActive: true })
          .groupBy('user.id')
          .getCount();
        break;

      case RankingType.CO2_REDUCTION:
        const userCo2Reduction = await this.userMissionRepository
          .createQueryBuilder('um')
          .innerJoin('um.user', 'user')
          .innerJoin('um.mission', 'mission')
          .select('SUM(mission.co2ReductionAmount) as totalReduction')
          .where('um.userId = :userId', { userId })
          .andWhere('um.status = :status', { status: UserMissionStatusEntity.COMPLETED })
          .andWhere('user.isActive = :isActive', { isActive: true })
          .getRawOne();
        
        userScore = parseFloat(userCo2Reduction?.totalReduction) || 0;
        
        const higherCo2Users = await this.userMissionRepository
          .createQueryBuilder('um')
          .innerJoin('um.user', 'user')
          .innerJoin('um.mission', 'mission')
          .select('SUM(mission.co2ReductionAmount) as totalReduction')
          .where('um.status = :status', { status: UserMissionStatusEntity.COMPLETED })
          .andWhere('user.isActive = :isActive', { isActive: true })
          .groupBy('user.id')
          .having('SUM(mission.co2ReductionAmount) > :userScore', { userScore })
          .getCount();
        
        rank = higherCo2Users + 1;
        
        totalUsers = await this.userMissionRepository
          .createQueryBuilder('um')
          .innerJoin('um.user', 'user')
          .innerJoin('um.mission', 'mission')
          .select('user.id')
          .where('um.status = :status', { status: UserMissionStatusEntity.COMPLETED })
          .andWhere('user.isActive = :isActive', { isActive: true })
          .groupBy('user.id')
          .getCount();
        break;
    }

    return { rank, score: userScore, totalUsers };
  }

  async deleteSnapshot(id: string): Promise<void> {
    return;
  }

  async getUserRanking(userId: string, type: RankingType): Promise<RankingSnapshot | null> {
    const userRanking = await this.getUserCurrentRanking(userId, type);
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
    const result = await this.getCurrentRankings(type, limit);
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