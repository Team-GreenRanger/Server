import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { MissionEntity } from './mission.entity';

export enum UserMissionStatusEntity {
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
}

@Entity('tbl_user_missions')
export class UserMissionEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 36 })
  userId: string;

  @Column('varchar', { length: 36 })
  missionId: string;

  @Column({
    type: 'enum',
    enum: UserMissionStatusEntity,
    default: UserMissionStatusEntity.ASSIGNED,
  })
  status: UserMissionStatusEntity;

  @Column('int', { default: 0 })
  currentProgress: number;



  @Column('json', { nullable: true })
  submissionImageUrls: string[];

  @Column('text', { nullable: true })
  submissionNote?: string;

  @Column('text', { nullable: true })
  verificationNote?: string;

  @Column('datetime', { nullable: true })
  submittedAt?: Date;

  @Column('datetime', { nullable: true })
  verifiedAt?: Date;

  @Column('datetime', { nullable: true })
  completedAt?: Date;

  @CreateDateColumn()
  assignedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => UserEntity, (user) => user.userMissions)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ManyToOne(() => MissionEntity, (mission) => mission.userMissions)
  @JoinColumn({ name: 'missionId' })
  mission: MissionEntity;
}
