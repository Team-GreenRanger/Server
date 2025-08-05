import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity';

export enum SavingType {
  BIKE_ROUTING = 'BIKE_ROUTING',      // 자전거 길찾기
  PUBLIC_TRANSPORT = 'PUBLIC_TRANSPORT', // 대중교통
  MISSION_COMPLETION = 'MISSION_COMPLETION', // 미션 완료
  OTHER = 'OTHER',                    // 기타
}

@Entity('tbl_carbon_savings')
@Index(['userId'])
@Index(['savingType'])
@Index(['userId', 'savingType'])
@Index(['createdAt'])
export class CarbonSavingsEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 36 })
  userId: string;

  // 절약 타입
  @Column({
    type: 'enum',
    enum: SavingType,
    default: SavingType.BIKE_ROUTING,
  })
  savingType: SavingType;

  // 절약한 탄소 배출량 (kg)
  @Column('decimal', { precision: 8, scale: 4 })
  co2SavedKg: number;

  // 이동 거리 (미터) - 라우팅의 경우
  @Column('int', { nullable: true })
  distanceMeters?: number;

  // 관련 세션 ID (라우팅 세션, 미션 ID 등)
  @Column('varchar', { length: 36, nullable: true })
  relatedId?: string;

  // 추가 설명
  @Column('varchar', { length: 500, nullable: true })
  description?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;
}
