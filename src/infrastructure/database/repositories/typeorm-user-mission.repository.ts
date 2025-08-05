import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserMission, UserMissionStatus } from '../../../domain/mission/entities/user-mission.entity';
import { IUserMissionRepository } from '../../../domain/mission/repositories/mission.repository.interface';
import { UserMissionEntity, UserMissionStatusEntity } from '../entities/user-mission.entity';

@Injectable()
export class TypeOrmUserMissionRepository implements IUserMissionRepository {
  constructor(
    @InjectRepository(UserMissionEntity)
    private readonly userMissionRepository: Repository<UserMissionEntity>,
  ) {}

  async save(userMission: UserMission): Promise<UserMission> {
    const userMissionEntity = this.toEntity(userMission);
    const savedEntity = await this.userMissionRepository.save(userMissionEntity);
    return this.toDomain(savedEntity);
  }

  async findById(id: string): Promise<UserMission | null> {
    const userMissionEntity = await this.userMissionRepository.findOne({ where: { id } });
    return userMissionEntity ? this.toDomain(userMissionEntity) : null;
  }

  async findByUserId(userId: string): Promise<UserMission[]> {
    const userMissionEntities = await this.userMissionRepository.find({ 
      where: { userId },
      relations: ['mission']
    });
    return userMissionEntities.map(entity => this.toDomain(entity));
  }

  async findByUserIdAndStatus(userId: string, status: UserMissionStatus): Promise<UserMission[]> {
    const userMissionEntities = await this.userMissionRepository.find({ 
      where: { 
        userId, 
        status: status as unknown as UserMissionStatusEntity 
      },
      relations: ['mission']
    });
    return userMissionEntities.map(entity => this.toDomain(entity));
  }

  async findByMissionId(missionId: string): Promise<UserMission[]> {
    const userMissionEntities = await this.userMissionRepository.find({ 
      where: { missionId } 
    });
    return userMissionEntities.map(entity => this.toDomain(entity));
  }

  async findUserMissionWithMission(userId: string, missionId: string): Promise<UserMission | null> {
    const userMissionEntity = await this.userMissionRepository.findOne({ 
      where: { userId, missionId } 
    });
    return userMissionEntity ? this.toDomain(userMissionEntity) : null;
  }

  async findCompletedMissionsByUserId(userId: string): Promise<UserMission[]> {
    const userMissionEntities = await this.userMissionRepository.find({ 
      where: { 
        userId, 
        status: UserMissionStatusEntity.COMPLETED 
      },
      relations: ['mission']
    });
    return userMissionEntities.map(entity => this.toDomain(entity));
  }

  async findTodayAssignedMissions(userId: string): Promise<UserMission[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const userMissionEntities = await this.userMissionRepository
      .createQueryBuilder('userMission')
      .where('userMission.userId = :userId', { userId })
      .andWhere('userMission.assignedAt >= :startOfDay', { startOfDay })
      .andWhere('userMission.assignedAt < :endOfDay', { endOfDay })
      .getMany();
    
    return userMissionEntities.map(entity => this.toDomain(entity));
  }

  async update(id: string, userMissionData: Partial<UserMission>): Promise<UserMission> {
    await this.userMissionRepository.update(id, userMissionData as any);
    const updatedEntity = await this.userMissionRepository.findOne({ where: { id } });
    if (!updatedEntity) {
      throw new Error('UserMission not found after update');
    }
    return this.toDomain(updatedEntity);
  }

  async delete(id: string): Promise<void> {
    await this.userMissionRepository.delete(id);
  }

  async countCompletedMissions(userId: string): Promise<number> {
    return await this.userMissionRepository.count({ 
      where: { 
        userId, 
        status: UserMissionStatusEntity.COMPLETED 
      } 
    });
  }

  async findPendingVerifications(): Promise<UserMission[]> {
    const userMissionEntities = await this.userMissionRepository.find({ 
      where: { status: UserMissionStatusEntity.SUBMITTED },
      relations: ['mission', 'user']
    });
    return userMissionEntities.map(entity => this.toDomain(entity));
  }

  private toEntity(userMission: UserMission): UserMissionEntity {
    const entity = new UserMissionEntity();
    entity.id = userMission.id;
    entity.userId = userMission.userId;
    entity.missionId = userMission.missionId;
    entity.status = userMission.status as unknown as UserMissionStatusEntity;
    entity.currentProgress = userMission.currentProgress;

    entity.submissionImageUrls = userMission.submissionImageUrls;
    entity.submissionNote = userMission.submissionNote;
    entity.verificationNote = userMission.verificationNote;
    entity.submittedAt = userMission.submittedAt;
    entity.verifiedAt = userMission.verifiedAt;
    entity.completedAt = userMission.completedAt;
    entity.assignedAt = userMission.assignedAt;
    entity.updatedAt = userMission.updatedAt;
    return entity;
  }

  private toDomain(entity: UserMissionEntity): UserMission {
    return UserMission.reconstitute({
      id: entity.id,
      userId: entity.userId,
      missionId: entity.missionId,
      status: entity.status as unknown as UserMissionStatus,
      currentProgress: entity.currentProgress,

      submissionImageUrls: entity.submissionImageUrls || [],
      submissionNote: entity.submissionNote,
      verificationNote: entity.verificationNote,
      submittedAt: entity.submittedAt,
      verifiedAt: entity.verifiedAt,
      completedAt: entity.completedAt,
      assignedAt: entity.assignedAt,
      updatedAt: entity.updatedAt,
    });
  }
}
