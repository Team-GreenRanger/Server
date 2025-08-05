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
import { BikeNetworkEntity } from './bike-network.entity';

@Entity('tbl_bike_stations')
@Index(['networkId'])
@Index(['externalId'])
@Index(['latitude', 'longitude'])
@Index(['networkId', 'externalId'], { unique: true })
export class BikeStationEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 36 })
  networkId: string;

  @Column('varchar', { length: 100 })
  externalId: string;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('decimal', { precision: 10, scale: 7 })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 7 })
  longitude: number;

  @Column('int', { default: 0 })
  freeBikes: number;

  @Column('int', { default: 0 })
  emptySlots: number;

  @Column('int')
  totalSlots: number;

  @Column('varchar', { length: 500, nullable: true })
  address?: string;

  @Column('varchar', { length: 20, nullable: true })
  postCode?: string;

  @Column('json')
  paymentMethods: string[];

  @Column('boolean', { default: false })
  hasPaymentTerminal: boolean;

  @Column('int', { default: 0 })
  altitude: number;

  @Column('varchar', { length: 500, nullable: true })
  androidUri?: string;

  @Column('varchar', { length: 500, nullable: true })
  iosUri?: string;

  @Column('boolean', { default: false })
  isVirtual: boolean;

  @Column('boolean', { default: true })
  isRenting: boolean;

  @Column('boolean', { default: true })
  isReturning: boolean;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  lastUpdated: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => BikeNetworkEntity, (network) => network.stations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'networkId' })
  network: BikeNetworkEntity;
}
