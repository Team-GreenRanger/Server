import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsNotEmpty, IsOptional, Min, Max } from 'class-validator';

export class StartRoutingDto {
  @ApiProperty({
    description: '출발지 위도',
    example: 37.5665,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  startLatitude: number;

  @ApiProperty({
    description: '출발지 경도',
    example: 126.9780,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  startLongitude: number;

  @ApiProperty({
    description: '목적지 위도',
    example: 37.5751,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  endLatitude: number;

  @ApiProperty({
    description: '목적지 경도',
    example: 126.9769,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  endLongitude: number;
}

export class CompleteRoutingDto {
  @ApiProperty({
    description: '라우팅 세션 ID',
    example: 'uuid-string',
  })
  @IsString()
  @IsNotEmpty()
  routingSessionId: string;

  @ApiProperty({
    description: '현재 위치 위도',
    example: 37.5751,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  currentLatitude: number;

  @ApiProperty({
    description: '현재 위치 경도',
    example: 126.9769,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  currentLongitude: number;

  @ApiProperty({
    description: '총 이동 거리 (미터)',
    example: 1500,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  totalDistanceMeters: number;
}

export class CancelRoutingDto {
  @ApiProperty({
    description: '취소할 라우팅 세션 ID',
    example: 'uuid-string',
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

export class RoutingSessionResponseDto {
  @ApiProperty({
    description: '라우팅 세션 ID',
    example: 'uuid-string',
  })
  id: string;

  @ApiProperty({
    description: '세션 상태',
    example: 'ACTIVE',
    enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
  })
  status: string;

  @ApiProperty({
    description: '출발지 정보',
    type: 'object',
    properties: {
      latitude: { type: 'number', example: 37.5665 },
      longitude: { type: 'number', example: 126.9780 },
    },
  })
  startLocation: {
    latitude: number;
    longitude: number;
  };

  @ApiProperty({
    description: '목적지 정보',
    type: 'object',
    properties: {
      latitude: { type: 'number', example: 37.5751 },
      longitude: { type: 'number', example: 126.9769 },
    },
  })
  endLocation: {
    latitude: number;
    longitude: number;
  };

  @ApiProperty({
    description: '직선 거리 (미터)',
    example: 1000,
  })
  straightLineDistance: number;

  @ApiProperty({
    description: '획득한 포인트',
    example: 15,
    required: false,
  })
  pointsEarned?: number;

  @ApiProperty({
    description: '절약한 CO2 배출량 (kg)',
    example: 0.288,
    required: false,
  })
  co2SavedKg?: number;

  @ApiProperty({
    description: '세션 생성 시간',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '세션 완료 시간',
    example: '2024-01-01T00:30:00.000Z',
    required: false,
  })
  completedAt?: Date;
}

export class Co2ReductionSummaryDto {
  @ApiProperty({
    description: '총 절약한 CO2 배출량 (kg)',
    example: 2.456,
  })
  totalCo2SavedKg: number;

  @ApiProperty({
    description: '총 이동 거리 (미터)',
    example: 128000,
  })
  totalDistanceMeters: number;

  @ApiProperty({
    description: '완료된 라우팅 세션 수',
    example: 42,
  })
  routingSessionCount: number;

  @ApiProperty({
    description: '총 이동 거리 (킬로미터)',
    example: 128.0,
  })
  totalDistanceKm: number;
}
