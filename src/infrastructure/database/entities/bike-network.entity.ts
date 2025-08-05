import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { BikeStationEntity } from './bike-station.entity';

@Entity('tbl_bike_networks')
@Index(['country', 'city'])
export class BikeNetworkEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 100, unique: true })
  externalId: string;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('decimal', { precision: 10, scale: 7 })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 7 })
  longitude: number;

  @Column('varchar', { length: 255 })
  city: string;

  @Column('varchar', { length: 2 })
  country: string;

  @Column('json')
  companies: string[];

  @Column('varchar', { length: 500, nullable: true })
  gbfsHref?: string;

  @Column('varchar', { length: 100, nullable: true })
  system?: string;

  @Column('varchar', { length: 500, nullable: true })
  source?: string;

  @Column('boolean', { default: false })
  ebikes: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => BikeStationEntity, (station) => station.network)
  stations: BikeStationEntity[];
}
