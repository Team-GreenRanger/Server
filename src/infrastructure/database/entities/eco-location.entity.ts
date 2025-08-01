import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum LocationTypeEntity {
  ECO_SPOT = 'ECO_SPOT',                    // 친환경 장소
  RECYCLING_CENTER = 'RECYCLING_CENTER',   // 재활용센터
  BIKE_SHARING = 'BIKE_SHARING',            // 자전거 공유 지점
  PUBLIC_TRANSPORT = 'PUBLIC_TRANSPORT',    // 대중교통 정류장
  GREEN_MARKET = 'GREEN_MARKET',            // 친환경 마켓
  CHARGING_STATION = 'CHARGING_STATION',   // 전기차 충전소
}

@Entity('eco_locations')
export class EcoLocationEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 200 })
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: LocationTypeEntity,
  })
  type: LocationTypeEntity;

  @Column('decimal', { precision: 10, scale: 8 })
  latitude: number;

  @Column('decimal', { precision: 11, scale: 8 })
  longitude: number;

  @Column('varchar', { length: 500, nullable: true })
  address?: string;

  @Column('varchar', { length: 20, nullable: true })
  phoneNumber?: string;

  @Column('varchar', { length: 200, nullable: true })
  website?: string;

  @Column('json', { nullable: true })
  operatingHours?: Record<string, string>;

  @Column('json', { nullable: true })
  amenities?: string[];

  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  rating?: number;

  @Column('varchar', { length: 500, nullable: true })
  imageUrl?: string;

  @Column('boolean', { default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
