import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserMissionEntity } from './user-mission.entity';

export enum MissionTypeEntity {
  ENERGY_SAVING = 'ENERGY_SAVING',
  TRANSPORTATION = 'TRANSPORTATION',
  WASTE_REDUCTION = 'WASTE_REDUCTION',
  RECYCLING = 'RECYCLING',
  WATER_CONSERVATION = 'WATER_CONSERVATION',
  SUSTAINABLE_CONSUMPTION = 'SUSTAINABLE_CONSUMPTION',
}

export enum MissionStatusEntity {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  INACTIVE = 'INACTIVE',
}

export enum DifficultyLevelEntity {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

@Entity('missions')
export class MissionEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 200 })
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: MissionTypeEntity,
  })
  type: MissionTypeEntity;

  @Column({
    type: 'enum',
    enum: DifficultyLevelEntity,
  })
  difficulty: DifficultyLevelEntity;

  @Column('decimal', { precision: 10, scale: 2 })
  co2ReductionAmount: number;

  @Column('int')
  creditReward: number;

  @Column('varchar', { length: 500, nullable: true })
  imageUrl?: string;

  @Column('json', { nullable: true })
  instructions: string[];

  @Column('json', { nullable: true })
  verificationCriteria: string[];

  @Column({
    type: 'enum',
    enum: MissionStatusEntity,
    default: MissionStatusEntity.ACTIVE,
  })
  status: MissionStatusEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => UserMissionEntity, (userMission) => userMission.mission)
  userMissions: UserMissionEntity[];
}
