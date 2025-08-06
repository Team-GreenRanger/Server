import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EcoTipCacheEntity } from '../entities/eco-tip-cache.entity';
import { EcoTipCache } from '../../../domain/eco-tip/entities/eco-tip-cache.entity';
import { IEcoTipCacheRepository } from '../../../domain/eco-tip/repositories/eco-tip-cache.repository.interface';

@Injectable()
export class TypeOrmEcoTipCacheRepository implements IEcoTipCacheRepository {
  constructor(
    @InjectRepository(EcoTipCacheEntity)
    private readonly ecoTipCacheRepository: Repository<EcoTipCacheEntity>,
  ) {}

  async save(ecoTipCache: EcoTipCache): Promise<EcoTipCache> {
    const entity = new EcoTipCacheEntity();
    entity.id = ecoTipCache.id;
    entity.userAge = ecoTipCache.userAge;
    entity.tipDate = ecoTipCache.tipDate;
    entity.tipContent = ecoTipCache.tipContent;
    entity.category = ecoTipCache.category;
    entity.createdAt = ecoTipCache.createdAt;

    const savedEntity = await this.ecoTipCacheRepository.save(entity);

    return EcoTipCache.reconstitute({
      id: savedEntity.id,
      userAge: savedEntity.userAge,
      tipDate: savedEntity.tipDate,
      tipContent: savedEntity.tipContent,
      category: savedEntity.category,
      createdAt: savedEntity.createdAt,
    });
  }

  async findByAgeAndDate(userAge: number, tipDate: Date): Promise<EcoTipCache | null> {
    // Date를 YYYY-MM-DD 문자열로 변환하여 비교
    const dateString = tipDate.toISOString().split('T')[0];
    
    const entity = await this.ecoTipCacheRepository.findOne({
      where: {
        userAge,
        tipDate: new Date(dateString),
      },
    });

    if (!entity) {
      return null;
    }

    return EcoTipCache.reconstitute({
      id: entity.id,
      userAge: entity.userAge,
      tipDate: entity.tipDate,
      tipContent: entity.tipContent,
      category: entity.category,
      createdAt: entity.createdAt,
    });
  }

  async deleteOldEntries(beforeDate: Date): Promise<void> {
    await this.ecoTipCacheRepository
      .createQueryBuilder()
      .delete()
      .from(EcoTipCacheEntity)
      .where('tipDate < :beforeDate', { beforeDate })
      .execute();
  }
}
