import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BikeNetworkEntity } from '../database/entities/bike-network.entity';
import { BikeStationEntity } from '../database/entities/bike-station.entity';
import { SeoulBikeService } from '../external-apis/seoul-bike/seoul-bike.service';

export interface BikeNetworkApiResponse {
  networks: Array<{
    id: string;
    name: string;
    location: {
      latitude: number;
      longitude: number;
      city: string;
      country: string;
    };
    href: string;
    company: string[];
    gbfs_href?: string;
    system?: string;
    source?: string;
    ebikes?: boolean;
  }>;
}

export interface BikeNetworkDetailResponse {
  network: {
    id: string;
    name: string;
    location: {
      latitude: number;
      longitude: number;
      city: string;
      country: string;
    };
    stations: Array<{
      id: string;
      name: string;
      latitude: number;
      longitude: number;
      timestamp: string;
      free_bikes: number;
      empty_slots: number;
      extra: {
        uid: string;
        renting: boolean;
        returning: boolean;
        last_updated: number;
        address?: string;
        post_code?: string;
        payment?: string[];
        'payment-terminal'?: boolean;
        altitude?: number;
        slots: number;
        rental_uris?: {
          android?: string;
          ios?: string;
        };
        virtual?: boolean;
      };
    }>;
  };
}

@Injectable()
export class BikeNetworkSchedulerService {
  private readonly logger = new Logger(BikeNetworkSchedulerService.name);
  private readonly API_BASE_URL = 'http://api.citybik.es/v2';

  // 동시성 제어 및 상태 관리
  private isSyncing = false;
  private isSeoulSyncing = false;
  private rateLimitedNetworks = new Set<string>();
  private readonly MAX_CONCURRENT_REQUESTS = 3;
  private readonly RATE_LIMIT_RETRY_DELAY = 60000; // 1분
  private readonly MAX_RETRIES = 3;

  constructor(
      @InjectRepository(BikeNetworkEntity)
      private readonly bikeNetworkRepository: Repository<BikeNetworkEntity>,
      @InjectRepository(BikeStationEntity)
      private readonly bikeStationRepository: Repository<BikeStationEntity>,
      private readonly seoulBikeService: SeoulBikeService,
  ) {}

  async onModuleInit() {
    const networkCount = await this.bikeNetworkRepository.count();
    const hasSeoulData = await this.seoulBikeService.hasInitialData();

    if (networkCount === 0) {
      this.logger.log('No bike networks found in database. Starting initial sync...');
      // 비동기로 실행하여 앱 시작을 블록하지 않음
      setImmediate(() => this.syncBikeNetworks());
    }

    if (!hasSeoulData) {
      this.logger.log('No Seoul bike data found. Starting Seoul bike sync...');
      // 비동기로 실행하여 앱 시작을 블록하지 않음
      setImmediate(() => this.syncSeoulBikes());
    }
  }

  @Cron('0 1 * * *', {
    name: 'sync-bike-networks',
    timeZone: 'Asia/Seoul',
  })
  async handleCron() {
    if (this.isSyncing) {
      this.logger.warn('Bike network sync already in progress, skipping...');
      return;
    }

    this.logger.log('Starting scheduled bike network sync...');
    await this.syncBikeNetworks();
  }

  @Cron('0 2 * * *', {
    name: 'sync-seoul-bikes',
    timeZone: 'Asia/Seoul',
  })
  async handleSeoulBikeCron() {
    if (this.isSeoulSyncing) {
      this.logger.warn('Seoul bike sync already in progress, skipping...');
      return;
    }

    this.logger.log('Starting scheduled Seoul bike sync...');
    await this.syncSeoulBikes();
  }

  // Rate limit된 네트워크들을 재시도하는 CRON (30분마다)
  @Cron('*/30 * * * *', {
    name: 'retry-rate-limited',
    timeZone: 'Asia/Seoul',
  })
  async handleRateLimitRetryCron() {
    if (this.rateLimitedNetworks.size > 0 && !this.isSyncing) {
      this.logger.log(`Retrying ${this.rateLimitedNetworks.size} rate-limited networks...`);
      await this.retryRateLimitedNetworks();
    }
  }

  async syncSeoulBikes(): Promise<void> {
    if (this.isSeoulSyncing) {
      this.logger.warn('Seoul bike sync already in progress');
      return;
    }

    this.isSeoulSyncing = true;
    try {
      this.logger.log('Starting Seoul bike stations sync...');
      await this.seoulBikeService.syncSeoulBikeStations();

      const stationCount = await this.seoulBikeService.getStationCount();
      this.logger.log(`Seoul bike sync completed. Total stations: ${stationCount}`);
    } catch (error) {
      this.logger.error('Failed to sync Seoul bikes:', error);
    } finally {
      this.isSeoulSyncing = false;
    }
  }

  async syncBikeNetworks(): Promise<void> {
    if (this.isSyncing) {
      this.logger.warn('Bike network sync already in progress');
      return;
    }

    this.isSyncing = true;
    try {
      this.logger.log('Fetching bike networks from API...');
      const networks = await this.fetchBikeNetworks();

      this.logger.log(`Found ${networks.length} networks. Processing with concurrency control...`);

      // 청크 단위로 처리하여 메모리 및 동시성 제어
      const chunks = this.chunkArray(networks, this.MAX_CONCURRENT_REQUESTS);
      let processedCount = 0;

      for (const chunk of chunks) {
        const promises = chunk.map(async (networkData) => {
          try {
            await this.processNetworkWithRetry(networkData);
            processedCount++;
            return { success: true, networkId: networkData.id };
          } catch (error) {
            this.logger.error(`Failed to process network ${networkData.id}:`, error.message);
            return { success: false, networkId: networkData.id, error };
          }
        });

        // 청크 단위로 병렬 처리
        const results = await Promise.allSettled(promises);

        // 진행상황 로깅
        if (processedCount % 10 === 0 || processedCount === networks.length) {
          this.logger.log(`Processed ${processedCount}/${networks.length} networks`);
        }

        // 다음 청크 처리 전 잠시 대기 (API 부하 분산)
        if (chunks.indexOf(chunk) < chunks.length - 1) {
          await this.sleep(2000);
        }
      }

      this.logger.log(`Bike network sync completed. Processed ${processedCount}/${networks.length} networks.`);
      if (this.rateLimitedNetworks.size > 0) {
        this.logger.log(`${this.rateLimitedNetworks.size} networks are rate-limited and will be retried later.`);
      }
    } catch (error) {
      this.logger.error('Failed to sync bike networks:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async retryRateLimitedNetworks(): Promise<void> {
    const networksToRetry = Array.from(this.rateLimitedNetworks);
    this.rateLimitedNetworks.clear();

    for (const networkId of networksToRetry) {
      try {
        const networkData = await this.fetchNetworkById(networkId);
        if (networkData) {
          await this.processNetworkWithRetry(networkData);
          this.logger.log(`Successfully retried rate-limited network: ${networkId}`);
        }
      } catch (error) {
        if (this.isRateLimitError(error)) {
          this.rateLimitedNetworks.add(networkId);
        }
        this.logger.error(`Failed to retry network ${networkId}:`, error.message);
      }
    }
  }

  private async processNetworkWithRetry(networkData: BikeNetworkApiResponse['networks'][0], retryCount = 0): Promise<void> {
    try {
      await this.processNetwork(networkData);
    } catch (error) {
      if (this.isRateLimitError(error)) {
        this.logger.warn(`Rate limit hit for network ${networkData.id}, will retry later`);
        this.rateLimitedNetworks.add(networkData.id);
        return;
      }

      if (retryCount < this.MAX_RETRIES && this.isRetryableError(error)) {
        this.logger.warn(`Retrying network ${networkData.id} (attempt ${retryCount + 1}/${this.MAX_RETRIES})`);
        await this.sleep(1000 * (retryCount + 1)); // 지수적 백오프
        return this.processNetworkWithRetry(networkData, retryCount + 1);
      }

      throw error;
    }
  }

  private async fetchBikeNetworks(): Promise<BikeNetworkApiResponse['networks']> {
    const response = await this.fetchWithRetry(`${this.API_BASE_URL}/networks`);
    const data: BikeNetworkApiResponse = await response.json();
    return data.networks;
  }

  private async fetchNetworkById(networkId: string): Promise<BikeNetworkApiResponse['networks'][0] | null> {
    try {
      const networks = await this.fetchBikeNetworks();
      return networks.find(n => n.id === networkId) || null;
    } catch (error) {
      this.logger.error(`Failed to fetch network data for ${networkId}:`, error);
      return null;
    }
  }

  private async fetchNetworkDetail(networkId: string): Promise<BikeNetworkDetailResponse['network']> {
    const response = await this.fetchWithRetry(`${this.API_BASE_URL}/networks/${networkId}`);
    const data: BikeNetworkDetailResponse = await response.json();
    return data.network;
  }

  private async fetchWithRetry(url: string, retryCount = 0): Promise<Response> {
    try {
      const response = await fetch(url);

      if (response.status === 429) {
        throw new Error(`Rate limit exceeded (429)`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      if (this.isRateLimitError(error)) {
        throw error; // Rate limit 에러는 바로 throw
      }

      if (retryCount < this.MAX_RETRIES && this.isRetryableError(error)) {
        this.logger.warn(`Retrying fetch ${url} (attempt ${retryCount + 1}/${this.MAX_RETRIES})`);
        await this.sleep(1000 * (retryCount + 1));
        return this.fetchWithRetry(url, retryCount + 1);
      }

      throw error;
    }
  }

  private async processNetwork(networkData: BikeNetworkApiResponse['networks'][0]): Promise<void> {
    let network = await this.bikeNetworkRepository.findOne({
      where: { externalId: networkData.id }
    });

    if (!network) {
      network = this.bikeNetworkRepository.create({
        id: this.generateUuid(),
        externalId: networkData.id,
        name: networkData.name,
        latitude: networkData.location.latitude,
        longitude: networkData.location.longitude,
        city: networkData.location.city,
        country: networkData.location.country,
        companies: networkData.company,
        gbfsHref: networkData.gbfs_href,
        system: networkData.system,
        source: networkData.source,
        ebikes: networkData.ebikes || false,
      });

      network = await this.bikeNetworkRepository.save(network);
      this.logger.log(`Created new network: ${networkData.name}`);
    } else {
      network.updatedAt = new Date();
      await this.bikeNetworkRepository.save(network);
    }

    try {
      const networkDetail = await this.fetchNetworkDetail(networkData.id);
      await this.processStations(network.id, networkDetail.stations || []);
    } catch (error) {
      if (this.isRateLimitError(error)) {
        throw error; // Rate limit 에러는 상위로 전파
      }
      this.logger.warn(`Failed to fetch stations for network ${networkData.id}:`, error.message);
    }
  }

  private async processStations(networkId: string, stationsData: BikeNetworkDetailResponse['network']['stations']): Promise<void> {
    const existingStations = await this.bikeStationRepository.find({
      where: { networkId }
    });

    const existingStationMap = new Map(
        existingStations.map(station => [station.externalId, station])
    );

    const processedExternalIds = new Set<string>();

    // 배치 처리를 위한 배열들
    const stationsToUpdate: BikeStationEntity[] = [];
    const stationsToCreate: BikeStationEntity[] = [];

    for (const stationData of stationsData) {
      processedExternalIds.add(stationData.id);

      const existingStation = existingStationMap.get(stationData.id);

      if (existingStation) {
        existingStation.freeBikes = stationData.free_bikes;
        existingStation.emptySlots = stationData.empty_slots;
        existingStation.lastUpdated = new Date();
        existingStation.updatedAt = new Date();
        stationsToUpdate.push(existingStation);
      } else {
        const newStation = this.bikeStationRepository.create({
          id: this.generateUuid(),
          networkId,
          externalId: stationData.id,
          name: stationData.name,
          latitude: stationData.latitude,
          longitude: stationData.longitude,
          freeBikes: stationData.free_bikes,
          emptySlots: stationData.empty_slots,
          totalSlots: stationData.extra?.slots || (stationData.free_bikes + stationData.empty_slots),
          address: stationData.extra?.address,
          postCode: stationData.extra?.post_code,
          paymentMethods: stationData.extra?.payment || [],
          hasPaymentTerminal: stationData.extra?.['payment-terminal'] || false,
          altitude: stationData.extra?.altitude || 0,
          androidUri: stationData.extra?.rental_uris?.android,
          iosUri: stationData.extra?.rental_uris?.ios,
          isVirtual: stationData.extra?.virtual || false,
          isRenting: stationData.extra?.renting !== false,
          isReturning: stationData.extra?.returning !== false,
          lastUpdated: new Date(),
        });
        stationsToCreate.push(newStation);
      }
    }

    // 배치 업데이트/생성
    if (stationsToUpdate.length > 0) {
      await this.bikeStationRepository.save(stationsToUpdate);
    }

    if (stationsToCreate.length > 0) {
      await this.bikeStationRepository.save(stationsToCreate);
    }

    // 제거할 스테이션들
    const stationsToRemove = existingStations.filter(
        station => !processedExternalIds.has(station.externalId)
    );

    if (stationsToRemove.length > 0) {
      await this.bikeStationRepository.remove(stationsToRemove);
      this.logger.log(`Removed ${stationsToRemove.length} outdated stations for network ${networkId}`);
    }
  }

  // 유틸리티 메서드들
  private isRateLimitError(error: any): boolean {
    return error?.message?.includes('Rate limit exceeded') ||
        error?.message?.includes('429');
  }

  private isRetryableError(error: any): boolean {
    const retryableStatuses = [408, 500, 502, 503, 504];
    return retryableStatuses.some(status =>
        error?.message?.includes(status.toString())
    );
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // 상태 확인용 메서드들 (선택사항)
  isSyncInProgress(): boolean {
    return this.isSyncing || this.isSeoulSyncing;
  }

  getRateLimitedNetworksCount(): number {
    return this.rateLimitedNetworks.size;
  }
}