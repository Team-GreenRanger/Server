import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LocationType, LocationStatus } from '../../../domain/location/entities/location.entity';

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
    enum: LocationType,
  })
  type: LocationType;

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

  @Column('varchar', { length: 200, nullable: true })
  websiteUrl?: string;

  @Column('json', { nullable: true })
  operatingHours?: Record<string, string>;

  @Column('text', { nullable: true })
  openingHours?: string;

  @Column('json', { nullable: true })
  amenities?: string[];

  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  rating?: number;

  @Column('varchar', { length: 500, nullable: true })
  imageUrl?: string;

  @Column('json', { nullable: true })
  imageUrls?: string[];

  @Column('int', { default: 0 })
  reviewCount: number;

  @Column({
    type: 'enum',
    enum: LocationStatus,
    default: LocationStatus.ACTIVE
  })
  status: LocationStatus;

  @Column('boolean', { default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
