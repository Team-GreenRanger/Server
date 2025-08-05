import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BikeNetworkEntity } from '../../database/entities/bike-network.entity';
import { BikeStationEntity } from '../../database/entities/bike-station.entity';
import { v4 as uuidv4 } from 'uuid';

export interface SeoulBikeStationResponse {
  stationInfo: {
    list_total_count: string;
    RESULT: {
      CODE: string;
      MESSAGE: string;
    };
    row: Array<{
      STA_LOC: string;      // 구역 (마포구, 광진구 등)
      RENT_ID: string;      // 스테이션 ID (ST-10, ST-100 등)
      RENT_NO: string;      // 스테이션 번호 (00108, 00503 등)
      RENT_NM: string;      // 스테이션 이름 (서교동 사거리 등)
      RENT_ID_NM: string;   // 전체 이름 (108. 서교동 사거리)
      HOLD_NUM: string;     // 보관소 수용량
      STA_ADD1: string;     // 주소1
      STA_ADD2: string;     // 주소2
      STA_LAT: string;      // 위도
      STA_LONG: string;     // 경도
      START_INDEX: number;
      END_INDEX: number;
      RNUM: string;
    }>;
  };
}

@Injectable()
export class SeoulBikeService {
  private readonly logger = new Logger(SeoulBikeService.name);
  private readonly seoulApiUrl = 'http://openapi.seoul.go.kr:8088/54656d66416976693938486a556373/json/tbCycleStationInfo/0/999';
  private readonly seoulNetworkId = '11111111-1111-4111-9111-000000000001';

  constructor(
    private configService: ConfigService,
    @InjectRepository(BikeNetworkEntity)
    private readonly bikeNetworkRepository: Repository<BikeNetworkEntity>,
    @InjectRepository(BikeStationEntity)
    private readonly bikeStationRepository: Repository<BikeStationEntity>,
  ) {}

  async syncSeoulBikeStations(): Promise<void> {
    this.logger.log('시작: 서울시 따릉이 스테이션 동기화');
    
    try {
      // 1. 서울 따릉이 네트워크 생성/확인
      await this.ensureSeoulNetwork();
      
      // 2. 서울시 API에서 데이터 가져오기
      const stationsData = await this.fetchSeoulStations();
      
      if (!stationsData || !stationsData.stationInfo || !stationsData.stationInfo.row) {
        this.logger.error('서울시 API에서 유효하지 않은 데이터 수신');
        return;
      }

      const stations = stationsData.stationInfo.row;
      this.logger.log(`가져온 스테이션 수: ${stations.length}`);
      
      // 3. 배치로 스테이션 데이터 업데이트
      await this.updateStationsInBatch(stations);
      
      this.logger.log(`완료: ${stations.length}개 스테이션 동기화 완료`);
      
    } catch (error) {
      this.logger.error('서울시 따릉이 스테이션 동기화 실패:', error);
      throw error;
    }
  }

  private async ensureSeoulNetwork(): Promise<void> {
    // 서울 따릉이 네트워크가 있는지 확인
    let network = await this.bikeNetworkRepository.findOne({
      where: { id: this.seoulNetworkId }
    });

    if (!network) {
      // 네트워크가 없으면 생성
      network = this.bikeNetworkRepository.create({
        id: this.seoulNetworkId,
        externalId: 'seoul_ddarung',
        name: 'seoul_ddarung_bike',
        latitude: 37.5665, // 서울시 중심좌표
        longitude: 126.9780,
        city: 'Seoul',
        country: 'KR',
        companies: ['서울시'],
        system: 'Seoul Bike Sharing',
        source: 'Seoul Open Data API',
        ebikes: false,
      });
      
      await this.bikeNetworkRepository.save(network);
      this.logger.log('서울 따릉이 네트워크 생성 완료');
    } else {
      this.logger.log('서울 따릉이 네트워크 이미 존재');
    }
  }

  private async fetchSeoulStations(): Promise<SeoulBikeStationResponse> {
    this.logger.log('서울시 API 호출 시작');
    
    try {
      const response = await fetch(this.seoulApiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'EcoLife-Server/1.0'
        },
      });

      if (!response.ok) {
        throw new Error(`서울시 API 오류: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // API 응답 상태 확인
      if (data.stationInfo?.RESULT?.CODE !== 'INFO-000') {
        throw new Error(`서울시 API 결과 오류: ${data.stationInfo?.RESULT?.MESSAGE}`);
      }

      this.logger.log(`서울시 API 호출 성공: ${data.stationInfo.list_total_count}개 스테이션`);
      return data;
      
    } catch (error) {
      this.logger.error('서울시 API 호출 실패:', error);
      throw error;
    }
  }

  private async updateStationsInBatch(stations: SeoulBikeStationResponse['stationInfo']['row']): Promise<void> {
    const batchSize = 100; // 한 번에 처리할 스테이션 수
    
    for (let i = 0; i < stations.length; i += batchSize) {
      const batch = stations.slice(i, i + batchSize);
      await this.processBatch(batch);
      this.logger.log(`배치 ${Math.floor(i / batchSize) + 1}/${Math.ceil(stations.length / batchSize)} 처리 완료`);
    }
  }

  private async processBatch(stations: SeoulBikeStationResponse['stationInfo']['row']): Promise<void> {
    const stationEntities: Partial<BikeStationEntity>[] = [];
    
    for (const station of stations) {
      try {
        const stationEntity = await this.mapSeoulStationToEntity(station);
        stationEntities.push(stationEntity);
      } catch (error) {
        this.logger.warn(`스테이션 ${station.RENT_ID} 매핑 실패: ${error.message}`);
      }
    }

    if (stationEntities.length > 0) {
      // upsert: 존재하면 업데이트, 없으면 삽입
      await this.bikeStationRepository.upsert(stationEntities, {
        conflictPaths: ['networkId', 'externalId'],
        skipUpdateIfNoValuesChanged: true,
      });
    }
  }

  private async mapSeoulStationToEntity(station: SeoulBikeStationResponse['stationInfo']['row'][0]): Promise<Partial<BikeStationEntity>> {
    // 기존 스테이션 찾기 (업데이트용)
    const existingStation = await this.bikeStationRepository.findOne({
      where: {
        networkId: this.seoulNetworkId,
        externalId: station.RENT_ID
      }
    });

    const latitude = parseFloat(station.STA_LAT);
    const longitude = parseFloat(station.STA_LONG);
    const totalSlots = parseInt(station.HOLD_NUM, 10);

    // 위도/경도 유효성 검사
    if (isNaN(latitude) || isNaN(longitude) || latitude === 0 || longitude === 0) {
      throw new Error(`유효하지 않은 좌표: lat=${station.STA_LAT}, lng=${station.STA_LONG}`);
    }

    // 용량 유효성 검사
    if (isNaN(totalSlots) || totalSlots <= 0) {
      throw new Error(`유효하지 않은 용량: ${station.HOLD_NUM}`);
    }

    const address = `${station.STA_ADD1}${station.STA_ADD2 ? ' ' + station.STA_ADD2 : ''}`.trim();

    return {
      id: existingStation?.id || uuidv4(),
      networkId: this.seoulNetworkId,
      externalId: station.RENT_ID,
      name: station.RENT_NM,
      latitude,
      longitude,
      totalSlots,
      address: address || undefined,
      
      // 서울시 API에는 없는 실시간 데이터는 기본값으로 설정
      freeBikes: existingStation?.freeBikes || 0,
      emptySlots: existingStation?.emptySlots || 0,
      
      // 기본 설정값들
      paymentMethods: [],
      hasPaymentTerminal: false,
      altitude: 0,
      isVirtual: false,
      isRenting: true,
      isReturning: true,
      lastUpdated: new Date(),
    };
  }

  async getStationCount(): Promise<number> {
    return await this.bikeStationRepository.count({
      where: { networkId: this.seoulNetworkId }
    });
  }

  async getNetworkInfo(): Promise<BikeNetworkEntity | null> {
    return await this.bikeNetworkRepository.findOne({
      where: { id: this.seoulNetworkId },
      relations: ['stations']
    });
  }

  async hasInitialData(): Promise<boolean> {
    const count = await this.getStationCount();
    return count > 0;
  }

  /**
   * 주변 자전거 스테이션 조회 (반경 내)
   * Haversine 공식을 사용한 거리 계산
   */
  async getNearbyStations(
    userLatitude: number,
    userLongitude: number,
    radiusInMeters: number
  ): Promise<Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    address?: string;
    freeBikes: number;
    emptySlots: number;
    totalSlots: number;
    distance: number; // 미터 단위
    isRenting: boolean;
    isReturning: boolean;
    network: {
      id: string;
      name: string;
      city: string;
    };
  }>> {
    try {
      // 데이터베이스에서 모든 스테이션 조회 (사용 가능한 것만)
      const allStations = await this.bikeStationRepository.find({
        where: {
          isRenting: true, // 대여 가능한 스테이션만
        },
        relations: ['network'],
      });

      // 거리 계산 및 필터링
      const nearbyStations = allStations
        .map(station => {
          const distance = this.calculateDistance(
            userLatitude,
            userLongitude,
            station.latitude,
            station.longitude
          );

          return {
            id: station.id,
            name: station.name,
            latitude: station.latitude,
            longitude: station.longitude,
            address: station.address,
            freeBikes: station.freeBikes,
            emptySlots: station.emptySlots,
            totalSlots: station.totalSlots,
            distance: Math.round(distance), // 미터 단위로 반올림
            isRenting: station.isRenting,
            isReturning: station.isReturning,
            network: {
              id: station.network.id,
              name: station.network.name,
              city: station.network.city,
            },
          };
        })
        .filter(station => station.distance <= radiusInMeters) // 반경 내만 필터링
        .sort((a, b) => a.distance - b.distance); // 거리순 정렬

      this.logger.log(
        `주변 스테이션 조회: 위치(${userLatitude}, ${userLongitude}), 반경 ${radiusInMeters}m, 결과 ${nearbyStations.length}개`
      );

      return nearbyStations;
    } catch (error) {
      this.logger.error('주변 스테이션 조회 실패:', error);
      throw new Error('주변 스테이션 조회에 실패했습니다');
    }
  }

  /**
   * Haversine 공식을 이용한 두 좌표 간 거리 계산 (미터)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // 지구 반지름 (m)
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // 미터 단위
  }

  /**
   * 도를 라디안으로 변환
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
