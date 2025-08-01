import { 
  Controller, 
  Get, 
  Post,
  Param,
  Body, 
  Query, 
  UseGuards,
  Request
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiBadRequestResponse,
  ApiNotFoundResponse
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { 
  EcoLocationResponseDto,
  LocationSearchQueryDto,
  LocationListResponseDto,
  LocationReviewDto,
  CreateLocationReviewDto,
  LocationReviewListResponseDto,
  NearbyLocationQueryDto
} from '../../../application/location/dto/location.dto';

@ApiTags('Locations')
@Controller('locations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LocationController {
  constructor() {}

  @Get()
  @ApiOperation({ summary: 'Search eco-friendly locations' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of eco-friendly locations', 
    type: LocationListResponseDto 
  })
  async searchLocations(@Query() queryDto: LocationSearchQueryDto): Promise<LocationListResponseDto> {
    // TODO: Implement search locations use case
    
    // Mock data for now
    return {
      locations: [
        {
          id: '1',
          name: '제로웨이스트샵 지구',
          description: '친환경 생활용품과 리필 상품을 판매하는 제로웨이스트 매장',
          type: 'ZERO_WASTE_SHOP' as any,
          address: '서울시 강남구 테헤란로 123',
          latitude: 37.5012,
          longitude: 127.0396,
          phoneNumber: '02-1234-5678',
          websiteUrl: 'https://zerowaste-earth.co.kr',
          openingHours: '10:00-20:00 (월-토), 휴무 (일)',
          imageUrls: ['https://example.com/shop1.jpg', 'https://example.com/shop2.jpg'],
          rating: 4.8,
          reviewCount: 127,
          status: 'ACTIVE' as any,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: '친환경 카페 그린',
          description: '유기농 원두와 재사용 컵을 사용하는 친환경 카페',
          type: 'ECO_FRIENDLY_RESTAURANT' as any,
          address: '서울시 마포구 홍대입구역 근처',
          latitude: 37.5563,
          longitude: 126.9236,
          phoneNumber: '02-9876-5432',
          openingHours: '08:00-22:00 (매일)',
          imageUrls: ['https://example.com/cafe1.jpg'],
          rating: 4.5,
          reviewCount: 89,
          status: 'ACTIVE' as any,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      total: 2,
      hasNext: false,
    };
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Get nearby eco-friendly locations' })
  @ApiResponse({ 
    status: 200, 
    description: 'Nearby eco-friendly locations', 
    type: LocationListResponseDto 
  })
  @ApiBadRequestResponse({ description: 'Invalid coordinates' })
  async getNearbyLocations(@Query() queryDto: NearbyLocationQueryDto): Promise<LocationListResponseDto> {
    // TODO: Implement get nearby locations use case
    
    // Mock data for now
    return {
      locations: [
        {
          id: '1',
          name: '제로웨이스트샵 지구',
          description: '친환경 생활용품과 리필 상품을 판매하는 제로웨이스트 매장',
          type: 'ZERO_WASTE_SHOP' as any,
          address: '서울시 강남구 테헤란로 123',
          latitude: 37.5012,
          longitude: 127.0396,
          phoneNumber: '02-1234-5678',
          websiteUrl: 'https://zerowaste-earth.co.kr',
          openingHours: '10:00-20:00 (월-토), 휴무 (일)',
          imageUrls: ['https://example.com/shop1.jpg'],
          rating: 4.8,
          reviewCount: 127,
          status: 'ACTIVE' as any,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      total: 1,
      hasNext: false,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get location details by ID' })
  @ApiParam({ name: 'id', description: 'Location ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Location details', 
    type: EcoLocationResponseDto 
  })
  @ApiNotFoundResponse({ description: 'Location not found' })
  async getLocationById(@Param('id') id: string): Promise<EcoLocationResponseDto> {
    // TODO: Implement get location by ID use case
    
    return {
      id,
      name: '제로웨이스트샵 지구',
      description: '친환경 생활용품과 리필 상품을 판매하는 제로웨이스트 매장',
      type: 'ZERO_WASTE_SHOP' as any,
      address: '서울시 강남구 테헤란로 123',
      latitude: 37.5012,
      longitude: 127.0396,
      phoneNumber: '02-1234-5678',
      websiteUrl: 'https://zerowaste-earth.co.kr',
      openingHours: '10:00-20:00 (월-토), 휴무 (일)',
      imageUrls: ['https://example.com/shop1.jpg', 'https://example.com/shop2.jpg'],
      rating: 4.8,
      reviewCount: 127,
      status: 'ACTIVE' as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get location reviews' })
  @ApiParam({ name: 'id', description: 'Location ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Location reviews', 
    type: LocationReviewListResponseDto 
  })
  async getLocationReviews(@Param('id') locationId: string): Promise<LocationReviewListResponseDto> {
    // TODO: Implement get location reviews use case
    
    return {
      reviews: [
        {
          id: 'review-1',
          userId: 'user-1',
          userName: '김환경',
          userProfileImage: 'https://example.com/avatar1.jpg',
          rating: 5,
          comment: '정말 좋은 제로웨이스트 매장이에요! 다양한 친환경 제품이 있고 직원분들도 친절해요.',
          createdAt: new Date(),
        },
        {
          id: 'review-2',
          userId: 'user-2',
          userName: '이지구',
          rating: 4,
          comment: '위치도 좋고 제품 품질도 만족스럽습니다.',
          createdAt: new Date(Date.now() - 86400000),
        },
      ],
      averageRating: 4.8,
      total: 2,
      hasNext: false,
    };
  }

  @Post(':id/reviews')
  @ApiOperation({ summary: 'Create location review' })
  @ApiParam({ name: 'id', description: 'Location ID' })
  @ApiResponse({ 
    status: 201, 
    description: 'Review created successfully', 
    type: LocationReviewDto 
  })
  @ApiBadRequestResponse({ description: 'Invalid review data' })
  async createLocationReview(
    @Request() req: any,
    @Param('id') locationId: string,
    @Body() reviewDto: CreateLocationReviewDto,
  ): Promise<LocationReviewDto> {
    // TODO: Implement create location review use case
    const userId = req.user.sub;
    
    return {
      id: 'review-' + Date.now(),
      userId,
      userName: '사용자', // TODO: Get from user service
      rating: reviewDto.rating,
      comment: reviewDto.comment,
      createdAt: new Date(),
    };
  }

  @Get('types/stats')
  @ApiOperation({ summary: 'Get location type statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Location type statistics'
  })
  async getLocationTypeStats(): Promise<any> {
    // TODO: Implement get location type stats use case
    
    return {
      totalLocations: 1250,
      typeStats: [
        { type: 'ZERO_WASTE_SHOP', count: 234, percentage: 18.7 },
        { type: 'ECO_FRIENDLY_RESTAURANT', count: 345, percentage: 27.6 },
        { type: 'RECYCLING_CENTER', count: 189, percentage: 15.1 },
        { type: 'ELECTRIC_CHARGING_STATION', count: 156, percentage: 12.5 },
        { type: 'BIKE_SHARING_STATION', count: 98, percentage: 7.8 },
        { type: 'PUBLIC_TRANSPORT', count: 123, percentage: 9.8 },
        { type: 'PARK_GREEN_SPACE', count: 67, percentage: 5.4 },
        { type: 'FARMERS_MARKET', count: 38, percentage: 3.0 },
      ],
    };
  }
}
