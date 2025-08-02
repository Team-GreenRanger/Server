import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EcoLocationEntity } from './eco-location.entity';

@Entity('location_reviews')
export class LocationReviewEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 36 })
  locationId: string;

  @Column('varchar', { length: 36 })
  userId: string;

  @Column('varchar', { length: 100 })
  userName: string;

  @Column('varchar', { length: 500, nullable: true })
  userProfileImage?: string;

  @Column('decimal', { precision: 2, scale: 1 })
  rating: number;

  @Column('text')
  comment: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => EcoLocationEntity)
  @JoinColumn({ name: 'locationId' })
  location: EcoLocationEntity;
}
