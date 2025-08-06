import { Injectable, Logger } from '@nestjs/common';

export interface EcoTipCacheEntry {
  userAge: number;
  tipDate: string; // YYYY-MM-DD format
  tipContent: string;
  category: string;
  timestamp: Date;
}

@Injectable()
export class InMemoryEcoTipCacheService {
  private readonly logger = new Logger(InMemoryEcoTipCacheService.name);
  private cache: Map<string, EcoTipCacheEntry> = new Map();

  constructor() {
    // Clean up old entries every hour
    setInterval(() => {
      this.cleanupOldEntries();
    }, 60 * 60 * 1000); // 1 hour
  }

  private generateCacheKey(userAge: number, tipDate: string): string {
    return `${userAge}_${tipDate}`;
  }

  async get(userAge: number, tipDate: string): Promise<EcoTipCacheEntry | null> {
    const key = this.generateCacheKey(userAge, tipDate);
    const entry = this.cache.get(key);
    
    if (entry) {
      console.log(`Cache hit for age ${userAge} on ${tipDate}`);
      return entry;
    }
    
    console.log(`Cache miss for age ${userAge} on ${tipDate}`);
    return null;
  }

  async set(userAge: number, tipDate: string, tipContent: string, category: string = 'daily_tip'): Promise<void> {
    const key = this.generateCacheKey(userAge, tipDate);
    const entry: EcoTipCacheEntry = {
      userAge,
      tipDate,
      tipContent,
      category,
      timestamp: new Date(),
    };
    
    this.cache.set(key, entry);
    console.log(`Cached tip for age ${userAge} on ${tipDate}`);
  }

  private cleanupOldEntries(): void {
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const cutoffDate = sevenDaysAgo.toISOString().split('T')[0];
    
    let deletedCount = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tipDate < cutoffDate) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      this.logger.log(`Cleaned up ${deletedCount} old cache entries`);
    }
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  clearAll(): void {
    this.cache.clear();
    this.logger.log('All cache entries cleared');
  }
}
