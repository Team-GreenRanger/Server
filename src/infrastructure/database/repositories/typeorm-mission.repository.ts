import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mission, MissionType, MissionStatus, DifficultyLevel } from '../../../domain/mission/entities/mission.entity';
import { IMissionRepository } from '../../../domain/mission/repositories/mission.repository.interface';
import { MissionEntity, MissionTypeEntity, MissionStatusEntity, DifficultyLevelEntity } from '../entities/mission.entity';

@Injectable()
export class TypeOrmMissionRepository implements IMissionRepository {
  constructor(
    @InjectRepository(MissionEntity)
    private readonly missionRepository: Repository<MissionEntity>,
  ) {}

  async save(mission: Mission): Promise<Mission> {
    const missionEntity = this.toEntity(mission);
    const savedEntity = await this.missionRepository.save(missionEntity);
    return this.toDomain(savedEntity);
  }

  async findById(id: string): Promise<Mission | null> {
    const missionEntity = await this.missionRepository.findOne({ where: { id } });
    return missionEntity ? this.toDomain(missionEntity) : null;
  }

  async findAll(): Promise<Mission[]> {
    const missionEntities = await this.missionRepository.find();
    return missionEntities.map(entity => this.toDomain(entity));
  }

  async findByStatus(status: MissionStatus): Promise<Mission[]> {
    const missionEntities = await this.missionRepository.find({ 
      where: { status: status as unknown as MissionStatusEntity } 
    });
    return missionEntities.map(entity => this.toDomain(entity));
  }

  async findByType(type: MissionType): Promise<Mission[]> {
    const missionEntities = await this.missionRepository.find({ 
      where: { type: type as unknown as MissionTypeEntity } 
    });
    return missionEntities.map(entity => this.toDomain(entity));
  }

  async findByDifficulty(difficulty: DifficultyLevel): Promise<Mission[]> {
    const missionEntities = await this.missionRepository.find({ 
      where: { difficulty: difficulty as unknown as DifficultyLevelEntity } 
    });
    return missionEntities.map(entity => this.toDomain(entity));
  }

  async findRandomActiveMissions(count: number): Promise<Mission[]> {
    const missionEntities = await this.missionRepository
      .createQueryBuilder('mission')
      .where('mission.status = :status', { status: MissionStatus.ACTIVE })
      .orderBy('RAND()', 'ASC')
      .limit(count)
      .getMany();
    
    return missionEntities.map(entity => this.toDomain(entity));
  }

  async update(id: string, missionData: Partial<Mission>): Promise<Mission> {
    await this.missionRepository.update(id, missionData as any);
    const updatedEntity = await this.missionRepository.findOne({ where: { id } });
    if (!updatedEntity) {
      throw new Error('Mission not found after update');
    }
    return this.toDomain(updatedEntity);
  }

  async delete(id: string): Promise<void> {
    await this.missionRepository.delete(id);
  }

  private toEntity(mission: Mission): MissionEntity {
    const entity = new MissionEntity();
    entity.id = mission.id;
    entity.title = mission.title;
    entity.description = mission.description;
    entity.type = mission.type as unknown as MissionTypeEntity;
    entity.difficulty = mission.difficulty as unknown as DifficultyLevelEntity;
    entity.co2ReductionAmount = mission.co2ReductionAmount;
    entity.creditReward = mission.creditReward;
    entity.requiredSubmissions = mission.requiredSubmissions;
    entity.imageUrl = mission.imageUrl;
    entity.instructions = mission.instructions;
    entity.verificationCriteria = mission.verificationCriteria;
    entity.status = mission.status as unknown as MissionStatusEntity;
    entity.createdAt = mission.createdAt;
    entity.updatedAt = mission.updatedAt;
    return entity;
  }

  private toDomain(entity: MissionEntity): Mission {
    return Mission.reconstitute({
      id: entity.id,
      title: entity.title,
      description: entity.description,
      type: entity.type as unknown as MissionType,
      difficulty: entity.difficulty as unknown as DifficultyLevel,
      co2ReductionAmount: entity.co2ReductionAmount,
      creditReward: entity.creditReward,
      requiredSubmissions: entity.requiredSubmissions,
      imageUrl: entity.imageUrl,
      instructions: entity.instructions || [],
      verificationCriteria: entity.verificationCriteria || [],
      status: entity.status as unknown as MissionStatus,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
