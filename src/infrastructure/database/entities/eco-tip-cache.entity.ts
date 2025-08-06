import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('eco_tip_cache')
export class EcoTipCacheEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('int')
  userAge: number;

  @Column('date')
  tipDate: Date; // KST 기준 날짜 (YYYY-MM-DD)

  @Column('text')
  tipContent: string;

  @Column('varchar', { length: 100, default: 'daily_tip' })
  category: string;

  @CreateDateColumn()
  createdAt: Date;
}
