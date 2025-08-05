import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SeoulBikeService } from '../../infrastructure/external-apis/seoul-bike/seoul-bike.service';
import { BikeNetworkSchedulerService } from '../../infrastructure/scheduler/bike-network-scheduler.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserEntity } from '../../infrastructure/database/entities/user.entity';
import { RoutingService } from '../../application/routing/services/routing.service';
import { 
  StartRoutingDto, 
  CompleteRoutingDto, 
  CancelRoutingDto,
  RoutingSessionResponseDto,
  Co2ReductionSummaryDto 
} from '../../application/routing/dto/routing.dto';

@ApiTags('Bike Management')
@Controller('bikes')
export class BikeController {
  constructor(
    private readonly seoulBikeService: SeoulBikeService,
    private readonly bikeSchedulerService: BikeNetworkSchedulerService,
    private readonly routingService: RoutingService,
  ) {}

  @Get('seoul/status')
  @ApiOperation({ summary: '서울 따릉이 데이터 상태 확인' })
  @ApiResponse({ status: 200, description: '서울 따릉이 데이터 상태' })
  async getSeoulBikeStatus() {
    const stationCount = await this.seoulBikeService.getStationCount();
    const networkInfo = await this.seoulBikeService.getNetworkInfo();
    
    return {
      hasData: stationCount > 0,
      stationCount,
      networkInfo: networkInfo ? {
        id: networkInfo.id,
        name: networkInfo.name,
        city: networkInfo.city,
        country: networkInfo.country,
        createdAt: networkInfo.createdAt,
        updatedAt: networkInfo.updatedAt,
      } : null,
    };
  }

  @Post('seoul/sync')
  @ApiOperation({ summary: '서울 따릉이 데이터 수동 동기화 (테스트용)' })
  @ApiResponse({ status: 200, description: '동기화 완료' })
  async syncSeoulBikes() {
    await this.bikeSchedulerService.syncSeoulBikes();
    
    const stationCount = await this.seoulBikeService.getStationCount();
    return {
      success: true,
      message: '서울 따릉이 데이터 동기화 완료',
      stationCount,
      timestamp: new Date(),
    };
  }

  // ===== 라우팅 관련 API =====
  
  @Post('routing/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '자전거 라우팅 세션 시작' })
  @ApiResponse({ status: 201, description: '라우팅 세션 생성 성공', type: 'object' })
  async startRoutingSession(
    @CurrentUser() user: UserEntity,
    @Body() startRoutingDto: StartRoutingDto,
  ) {
    const session = await this.routingService.startRoutingSession(user.id, {
      startLatitude: startRoutingDto.startLatitude,
      startLongitude: startRoutingDto.startLongitude,
      endLatitude: startRoutingDto.endLatitude,
      endLongitude: startRoutingDto.endLongitude,
    });

    return {
      success: true,
      message: '라우팅 세션이 시작되었습니다',
      data: session,
      timestamp: new Date(),
    };
  }

  @Post('routing/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '자전거 라우팅 세션 완료' })
  @ApiResponse({ status: 200, description: '라우팅 세션 완료 성공', type: 'object' })
  async completeRoutingSession(
    @CurrentUser() user: UserEntity,
    @Body() completeRoutingDto: CompleteRoutingDto,
  ) {
    const session = await this.routingService.completeRoutingSession(user.id, {
      routingSessionId: completeRoutingDto.routingSessionId,
      currentLatitude: completeRoutingDto.currentLatitude,
      currentLongitude: completeRoutingDto.currentLongitude,
      totalDistanceMeters: completeRoutingDto.totalDistanceMeters,
    });

    return {
      success: true,
      message: `라우팅 완료! 포인트 ${session.pointsEarned}점 획듹, CO2 ${session.co2SavedKg?.toFixed(3)}kg 절약`,
      data: session,
      timestamp: new Date(),
    };
  }

  @Get('routing/active')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '활성 라우팅 세션 조회' })
  @ApiResponse({ status: 200, description: '활성 라우팅 세션 정보' })
  async getActiveRoutingSession(@CurrentUser() user: UserEntity) {
    const activeSession = await this.routingService.getActiveRoutingSession(user.id);

    return {
      success: true,
      data: activeSession,
      message: activeSession ? '활성 라우팅 세션이 있습니다' : '활성 라우팅 세션이 없습니다',
      timestamp: new Date(),
    };
  }

  @Post('routing/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '라우팅 세션 취소' })
  @ApiResponse({ status: 200, description: '라우팅 세션 취소 성공' })
  async cancelRoutingSession(
    @CurrentUser() user: UserEntity,
    @Body() cancelRoutingDto: CancelRoutingDto,
  ) {
    await this.routingService.cancelRoutingSession(user.id, cancelRoutingDto.sessionId);

    return {
      success: true,
      message: '라우팅 세션이 취소되었습니다',
      timestamp: new Date(),
    };
  }

  @Get('routing/co2-summary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자 총 탄소 절약량 조회' })
  @ApiResponse({ status: 200, description: '사용자의 총 탄소 절약량 정보', type: 'object' })
  async getCo2ReductionSummary(@CurrentUser() user: UserEntity) {
    const summary = await this.routingService.getTotalCo2Reduction(user.id);

    return {
      success: true,
      data: {
        ...summary,
        totalDistanceKm: Math.round(summary.totalDistanceMeters / 1000 * 10) / 10, // km 단위로 변환 (소수점 1자리)
      },
      message: `총 ${summary.routingSessionCount}번의 자전거 이동으로 ${summary.totalCo2SavedKg.toFixed(3)}kg의 CO2를 절약했습니다!`,
      timestamp: new Date(),
    };
  }

  @Post('global/sync')
  @ApiOperation({ summary: '전세계 자전거 네트워크 수동 동기화 (테스트용)' })
  @ApiResponse({ status: 200, description: '동기화 완료' })
  async syncGlobalBikes() {
    await this.bikeSchedulerService.syncBikeNetworks();
    
    return {
      success: true,
      message: '전세계 자전거 네트워크 동기화 완료',
      timestamp: new Date(),
    };
  }

  @Get('stations/nearby')
  @ApiOperation({ summary: '주변 자전거 스테이션 조회' })
  @ApiResponse({ status: 200, description: '주변 자전거 스테이션 목록' })
  async getNearbyStations(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius: number = 1000, // 기본값 1km
  ) {
    // 입력값 검증
    if (!latitude || !longitude) {
      throw new Error('위도와 경도는 필수입니다');
    }
    
    if (latitude < -90 || latitude > 90) {
      throw new Error('위도는 -90과 90 사이여야 합니다');
    }
    
    if (longitude < -180 || longitude > 180) {
      throw new Error('경도는 -180과 180 사이여야 합니다');
    }
    
    if (radius < 100 || radius > 10000) {
      throw new Error('반경은 100m에서 10km 사이여야 합니다');
    }

    const nearbyStations = await this.seoulBikeService.getNearbyStations(
      latitude,
      longitude,
      radius
    );

    return {
      success: true,
      data: {
        userLocation: {
          latitude,
          longitude,
        },
        searchRadius: radius,
        stationCount: nearbyStations.length,
        stations: nearbyStations,
      },
      timestamp: new Date(),
    };
  }
}
