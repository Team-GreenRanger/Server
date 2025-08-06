import { EcoTipCache } from '../entities/eco-tip-cache.entity';

export interface IEcoTipCacheRepository {
  save(ecoTipCache: EcoTipCache): Promise<EcoTipCache>;
  findByAgeAndDate(userAge: number, tipDate: Date): Promise<EcoTipCache | null>;
  deleteOldEntries(beforeDate: Date): Promise<void>;
}

export const ECO_TIP_CACHE_REPOSITORY = Symbol('ECO_TIP_CACHE_REPOSITORY');
