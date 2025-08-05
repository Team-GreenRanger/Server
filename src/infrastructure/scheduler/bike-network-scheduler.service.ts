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
      await this.syncBikeNetworks();
    }
    
    if (!hasSeoulData) {
      this.logger.log('No Seoul bike data found. Starting Seoul bike sync...');
      await this.syncSeoulBikes();
    }
  }

  @Cron('0 1 * * *', {
    name: 'sync-bike-networks',
    timeZone: 'Asia/Seoul',
  })
  async handleCron() {
    this.logger.log('Starting scheduled bike network sync...');
    await this.syncBikeNetworks();
  }

  // 서울 따릉이는 새벽 2시에 동기화 (별도 시간으로 분산)
  @Cron('0 2 * * *', {
    name: 'sync-seoul-bikes',
    timeZone: 'Asia/Seoul',
  })
  async handleSeoulBikeCron() {
    this.logger.log('Starting scheduled Seoul bike sync...');
    await this.syncSeoulBikes();
  }

  async syncSeoulBikes(): Promise<void> {
    try {
      this.logger.log('Starting Seoul bike stations sync...');
      await this.seoulBikeService.syncSeoulBikeStations();
      
      const stationCount = await this.seoulBikeService.getStationCount();
      this.logger.log(`Seoul bike sync completed. Total stations: ${stationCount}`);
    } catch (error) {
      this.logger.error('Failed to sync Seoul bikes:', error);
    }
  }

  async syncBikeNetworks(): Promise<void> {
    try {
      this.logger.log('Fetching bike networks from API...');
      const networks = await this.fetchBikeNetworks();
      
      this.logger.log(`Found ${networks.length} networks. Processing...`);
      
      let processedCount = 0;
      for (const networkData of networks) {
        try {
          await this.processNetwork(networkData);
          processedCount++;
          
          if (processedCount % 10 === 0) {
            this.logger.log(`Processed ${processedCount}/${networks.length} networks`);
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          this.logger.error(`Failed to process network ${networkData.id}:`, error.message);
        }
      }
      
      this.logger.log(`Bike network sync completed. Processed ${processedCount}/${networks.length} networks.`);
    } catch (error) {
      this.logger.error('Failed to sync bike networks:', error);
    }
  }

  private async fetchBikeNetworks(): Promise<BikeNetworkApiResponse['networks']> {
    const response = await fetch(`${this.API_BASE_URL}/networks`);
    if (!response.ok) {
      throw new Error(`Failed to fetch networks: ${response.status} ${response.statusText}`);
    }
    
    const data: BikeNetworkApiResponse = await response.json();
    return data.networks;
  }

  private async fetchNetworkDetail(networkId: string): Promise<BikeNetworkDetailResponse['network']> {
    const response = await fetch(`${this.API_BASE_URL}/networks/${networkId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch network ${networkId}: ${response.status} ${response.statusText}`);
    }
    
    const data: BikeNetworkDetailResponse = await response.json();
    return data.network;
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

    for (const stationData of stationsData) {
      processedExternalIds.add(stationData.id);
      
      const existingStation = existingStationMap.get(stationData.id);
      
      if (existingStation) {
        existingStation.freeBikes = stationData.free_bikes;
        existingStation.emptySlots = stationData.empty_slots;
        existingStation.lastUpdated = new Date();
        existingStation.updatedAt = new Date();
        
        await this.bikeStationRepository.save(existingStation);
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
        
        await this.bikeStationRepository.save(newStation);
      }
    }

    const stationsToRemove = existingStations.filter(
      station => !processedExternalIds.has(station.externalId)
    );
    
    if (stationsToRemove.length > 0) {
      await this.bikeStationRepository.remove(stationsToRemove);
      this.logger.log(`Removed ${stationsToRemove.length} outdated stations for network ${networkId}`);
    }
  }

  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
