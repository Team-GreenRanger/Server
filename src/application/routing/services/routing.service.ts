import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { RoutingSessionEntity, RoutingStatus } from '../../../infrastructure/database/entities/routing-session.entity';
import { CarbonSavingsEntity, SavingType } from '../../../infrastructure/database/entities/carbon-savings.entity';
import { UserEntity } from '../../../infrastructure/database/entities/user.entity';
import { CarbonCreditEntity } from '../../../infrastructure/database/entities/carbon-credit.entity';

export interface StartRoutingRequest {
  startLatitude: number;
  startLongitude: number;
  endLatitude: number;
  endLongitude: number;
}

export interface CompleteRoutingRequest {
  routingSessionId: string;
  currentLatitude: number;
  currentLongitude: number;
  totalDistanceMeters: number; // 클라이언트에서 계산한 실제 이동거리
}

export interface RoutingSessionResponse {
  id: string;
  status: RoutingStatus;
  startLocation: {
    latitude: number;
    longitude: number;
  };
  endLocation: {
    latitude: number;
    longitude: number;
  };
  straightLineDistance: number;
  pointsEarned?: number;
  co2SavedKg?: number;
  createdAt: Date;
  completedAt?: Date;
}

@Injectable()
export class RoutingService {
  private readonly logger = new Logger(RoutingService.name);
  
  // 100m당 1포인트
  private readonly POINTS_PER_100M = 1;
  
  // 100m당 0.0192kg CO2 절약 (자동차 대신 자전거 이용시)
  private readonly CO2_SAVING_PER_100M_KG = 0.0192;
  
  // 도착 인정 범위 (미터)
  private readonly ARRIVAL_THRESHOLD_METERS = 100;

  constructor(
    @InjectRepository(RoutingSessionEntity)
    private readonly routingSessionRepository: Repository<RoutingSessionEntity>,
    @InjectRepository(CarbonSavingsEntity)
    private readonly carbonSavingsRepository: Repository<CarbonSavingsEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(CarbonCreditEntity)
    private readonly carbonCreditRepository: Repository<CarbonCreditEntity>,
  ) {}

  /**
   * 라우팅 세션 시작
   */
  async startRoutingSession(
    userId: string, 
    request: StartRoutingRequest
  ): Promise<RoutingSessionResponse> {
    this.logger.log(`라우팅 세션 시작: 사용자 ${userId}`);

    // 입력값 검증
    this.validateCoordinates(request.startLatitude, request.startLongitude);
    this.validateCoordinates(request.endLatitude, request.endLongitude);

    // 기존 활성 세션이 있는지 확인
    const existingActiveSession = await this.routingSessionRepository.findOne({
      where: {
        userId,
        status: RoutingStatus.ACTIVE,
      },
    });

    if (existingActiveSession) {
      throw new Error('이미 진행 중인 라우팅 세션이 있습니다. 먼저 완료하거나 취소해주세요.');
    }

    // 직선거리 계산 (검증용)
    const straightLineDistance = this.calculateDistance(
      request.startLatitude,
      request.startLongitude,
      request.endLatitude,
      request.endLongitude
    );

    // 최소 거리 검증 (너무 가까우면 의미없음)
    if (straightLineDistance < 100) {
      throw new Error('목적지가 너무 가깝습니다. 최소 100m 이상 떨어진 곳을 설정해주세요.');
    }

    // 최대 거리 검험 (너무 멀면 비현실적)
    if (straightLineDistance > 50000) {
      throw new Error('목적지가 너무 멉니다. 최대 50km 이내로 설정해주세요.');
    }

    // 새 라우팅 세션 생성
    const newSession = this.routingSessionRepository.create({
      id: uuidv4(),
      userId,
      startLatitude: request.startLatitude,
      startLongitude: request.startLongitude,
      endLatitude: request.endLatitude,
      endLongitude: request.endLongitude,
      straightLineDistanceMeters: Math.round(straightLineDistance),
      status: RoutingStatus.ACTIVE,
    });

    const savedSession = await this.routingSessionRepository.save(newSession);

    this.logger.log(
      `라우팅 세션 생성 완료: ${savedSession.id}, 직선거리: ${Math.round(straightLineDistance)}m`
    );

    return {
      id: savedSession.id,
      status: savedSession.status,
      startLocation: {
        latitude: savedSession.startLatitude,
        longitude: savedSession.startLongitude,
      },
      endLocation: {
        latitude: savedSession.endLatitude,
        longitude: savedSession.endLongitude,
      },
      straightLineDistance: savedSession.straightLineDistanceMeters,
      createdAt: savedSession.createdAt,
    };
  }

  /**
   * 라우팅 세션 완료 (도착 확인 및 포인트 지급)
   */
  async completeRoutingSession(
    userId: string,
    request: CompleteRoutingRequest
  ): Promise<RoutingSessionResponse> {
    this.logger.log(`라우팅 세션 완료 요청: 사용자 ${userId}, 세션 ${request.routingSessionId}`);

    // 세션 조회 및 검증
    const session = await this.routingSessionRepository.findOne({
      where: {
        id: request.routingSessionId,
        userId,
        status: RoutingStatus.ACTIVE,
      },
    });

    if (!session) {
      throw new Error('활성 상태의 라우팅 세션을 찾을 수 없습니다.');
    }

    // 도착지 근처에 있는지 확인 (100m 이내)
    const distanceToDestination = this.calculateDistance(
      request.currentLatitude,
      request.currentLongitude,
      session.endLatitude,
      session.endLongitude
    );

    if (distanceToDestination > this.ARRIVAL_THRESHOLD_METERS) {
      throw new Error(
        `목적지에서 ${Math.round(distanceToDestination)}m 떨어져 있습니다. ${this.ARRIVAL_THRESHOLD_METERS}m 이내로 접근해주세요.`
      );
    }

    // 이동거리 검증 (비정상적인 거리 차단)
    const straightLineDistance = session.straightLineDistanceMeters;
    const reportedDistance = request.totalDistanceMeters;
    
    // 보고된 거리가 직선거리의 10배를 초과하면 비정상적으로 간주
    const maxAllowedDistance = straightLineDistance * 10;
    if (reportedDistance > maxAllowedDistance) {
      this.logger.warn(
        `비정상적인 이동거리 감지: 직선거리 ${straightLineDistance}m, 보고거리 ${reportedDistance}m`
      );
      throw new Error(
        `보고된 이동거리(${reportedDistance}m)가 비정상적입니다. 다시 시도해주세요.`
      );
    }

    // 최소 거리 검증 (직선거리보다 작을 수는 없음)
    if (reportedDistance < straightLineDistance * 0.8) {
      this.logger.warn(
        `보고된 거리가 너무 짧음: 직선거리 ${straightLineDistance}m, 보고거리 ${reportedDistance}m`
      );
      throw new Error('보고된 이동거리가 너무 짧습니다. 정확한 거리를 입력해주세요.');
    }

    // 포인트 및 탄소 절약량 계산
    const pointsEarned = Math.round(reportedDistance / 100 * this.POINTS_PER_100M);
    const co2SavedKg = (reportedDistance / 100) * this.CO2_SAVING_PER_100M_KG;

    // 트랜잭션으로 처리
    await this.routingSessionRepository.manager.transaction(async manager => {
      // 1. 세션 완료 처리
      session.status = RoutingStatus.COMPLETED;
      session.totalDistanceMeters = reportedDistance;
      session.pointsEarned = pointsEarned;
      session.co2SavedKg = co2SavedKg;
      session.completedAt = new Date();
      await manager.save(session);

      // 2. 사용자 포인트 업데이트
      await manager.increment(
        UserEntity,
        { id: userId },
        'carbonCreditBalance',
        pointsEarned
      );

      // 3. 탄소 절약 기록 생성
      const carbonSaving = manager.create(CarbonSavingsEntity, {
        id: uuidv4(),
        userId,
        savingType: SavingType.BIKE_ROUTING,
        co2SavedKg,
        distanceMeters: reportedDistance,
        relatedId: session.id,
        description: `자전거 길찾기 완료: ${Math.round(reportedDistance / 1000 * 10) / 10}km 이동`,
      });
      await manager.save(carbonSaving);

      // 4. 탄소 크레딧 거래 기록 생성
      const carbonCredit = manager.create(CarbonCreditEntity, {
        id: uuidv4(),
        userId,
        amount: pointsEarned,
        type: 'EARNED',
        source: 'BIKE_ROUTING',
        description: `자전거 길찾기 완료 보상: ${Math.round(reportedDistance / 1000 * 10) / 10}km`,
        relatedId: session.id,
      });
      await manager.save(carbonCredit);
    });

    this.logger.log(
      `라우팅 세션 완료: ${session.id}, 거리: ${reportedDistance}m, 포인트: ${pointsEarned}, CO2절약: ${co2SavedKg.toFixed(4)}kg`
    );

    return {
      id: session.id,
      status: session.status,
      startLocation: {
        latitude: session.startLatitude,
        longitude: session.startLongitude,
      },
      endLocation: {
        latitude: session.endLatitude,
        longitude: session.endLongitude,
      },
      straightLineDistance: session.straightLineDistanceMeters,
      pointsEarned: session.pointsEarned,
      co2SavedKg: session.co2SavedKg,
      createdAt: session.createdAt,
      completedAt: session.completedAt,
    };
  }

  /**
   * 사용자의 활성 라우팅 세션 조회
   */
  async getActiveRoutingSession(userId: string): Promise<RoutingSessionResponse | null> {
    const activeSession = await this.routingSessionRepository.findOne({
      where: {
        userId,
        status: RoutingStatus.ACTIVE,
      },
    });

    if (!activeSession) {
      return null;
    }

    return {
      id: activeSession.id,
      status: activeSession.status,
      startLocation: {
        latitude: activeSession.startLatitude,
        longitude: activeSession.startLongitude,
      },
      endLocation: {
        latitude: activeSession.endLatitude,
        longitude: activeSession.endLongitude,
      },
      straightLineDistance: activeSession.straightLineDistanceMeters,
      createdAt: activeSession.createdAt,
    };
  }

  /**
   * 라우팅 세션 취소
   */
  async cancelRoutingSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.routingSessionRepository.findOne({
      where: {
        id: sessionId,
        userId,
        status: RoutingStatus.ACTIVE,
      },
    });

    if (!session) {
      throw new Error('활성 상태의 라우팅 세션을 찾을 수 없습니다.');
    }

    session.status = RoutingStatus.CANCELLED;
    session.completedAt = new Date();
    await this.routingSessionRepository.save(session);

    this.logger.log(`라우팅 세션 취소: ${sessionId}`);
  }

  /**
   * 사용자의 총 탄소 절약량 조회
   */
  async getTotalCo2Reduction(userId: string): Promise<{
    totalCo2SavedKg: number;
    totalDistanceMeters: number;
    routingSessionCount: number;
  }> {
    const result = await this.carbonSavingsRepository
      .createQueryBuilder('savings')
      .select([
        'SUM(savings.co2SavedKg) as totalCo2SavedKg',
        'SUM(savings.distanceMeters) as totalDistanceMeters',
        'COUNT(savings.id) as routingSessionCount',
      ])
      .where('savings.userId = :userId', { userId })
      .andWhere('savings.savingType = :savingType', { savingType: SavingType.BIKE_ROUTING })
      .getRawOne();

    return {
      totalCo2SavedKg: parseFloat(result.totalCo2SavedKg) || 0,
      totalDistanceMeters: parseInt(result.totalDistanceMeters) || 0,
      routingSessionCount: parseInt(result.routingSessionCount) || 0,
    };
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

  /**
   * 좌표 유효성 검증
   */
  private validateCoordinates(latitude: number, longitude: number): void {
    if (latitude < -90 || latitude > 90) {
      throw new Error(`유효하지 않은 위도: ${latitude}`);
    }
    
    if (longitude < -180 || longitude > 180) {
      throw new Error(`유효하지 않은 경도: ${longitude}`);
    }
  }
}
