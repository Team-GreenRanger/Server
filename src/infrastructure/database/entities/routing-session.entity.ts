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

export enum RoutingStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('tbl_routing_sessions')
@Index(['userId'])
@Index(['status'])
@Index(['userId', 'status'])
export class RoutingSessionEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 36 })
  userId: string;

  // 출발지 좌표
  @Column('decimal', { precision: 10, scale: 7 })
  startLatitude: number;

  @Column('decimal', { precision: 10, scale: 7 })
  startLongitude: number;

  // 목적지 좌표
  @Column('decimal', { precision: 10, scale: 7 })
  endLatitude: number;

  @Column('decimal', { precision: 10, scale: 7 })
  endLongitude: number;

  // 세션 상태
  @Column({
    type: 'enum',
    enum: RoutingStatus,
    default: RoutingStatus.ACTIVE,
  })
  status: RoutingStatus;

  // 클라이언트에서 계산한 총 이동 거리 (미터)
  @Column('int', { nullable: true })
  totalDistanceMeters?: number;

  // 실제 E2E 직선 거리 (미터) - 검증용
  @Column('int')
  straightLineDistanceMeters: number;

  // 획득한 포인트
  @Column('int', { default: 0 })
  pointsEarned: number;

  // 절약한 탄소 배출량 (kg)
  @Column('decimal', { precision: 8, scale: 4, default: 0 })
  co2SavedKg: number;

  // 세션 시작 시간
  @CreateDateColumn()
  createdAt: Date;

  // 세션 완료/취소 시간
  @Column('timestamp', { nullable: true })
  completedAt?: Date;

  // 마지막 업데이트 시간
  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;
}
