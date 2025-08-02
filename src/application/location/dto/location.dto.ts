import { IsOptional, IsNumber, Min, Max, IsEnum, IsString, IsLatitude, IsLongitude } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum LocationTypeDto {
  ZERO_WASTE_SHOP = 'ZERO_WASTE_SHOP',
  ECO_FRIENDLY_RESTAURANT = 'ECO_FRIENDLY_RESTAURANT',
  RECYCLING_CENTER = 'RECYCLING_CENTER',
  ELECTRIC_CHARGING_STATION = 'ELECTRIC_CHARGING_STATION',
  BIKE_SHARING_STATION = 'BIKE_SHARING_STATION',
  PUBLIC_TRANSPORT = 'PUBLIC_TRANSPORT',
  PARK_GREEN_SPACE = 'PARK_GREEN_SPACE',
  FARMERS_MARKET = 'FARMERS_MARKET',
}

export enum LocationStatusDto {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export class EcoLocationResponseDto {
  @ApiProperty({ description: 'Location ID' })
  id: string;

  @ApiProperty({ description: 'Location name' })
  name: string;

  @ApiProperty({ description: 'Location description' })
  description: string;

  @ApiProperty({ enum: LocationTypeDto, description: 'Location type' })
  type: LocationTypeDto;

  @ApiProperty({ description: 'Location address' })
  address: string;

  @ApiProperty({ description: 'Latitude coordinate' })
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  longitude: number;

  @ApiPropertyOptional({ description: 'Phone number' })
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Website URL' })
  websiteUrl?: string;

  @ApiPropertyOptional({ description: 'Opening hours' })
  openingHours?: string;

  @ApiProperty({ type: [String], description: 'Image URLs' })
  imageUrls: string[];

  @ApiProperty({ description: 'Average rating' })
  rating: number;

  @ApiProperty({ description: 'Number of reviews' })
  reviewCount: number;

  @ApiProperty({ enum: LocationStatusDto, description: 'Location status' })
  status: LocationStatusDto;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class LocationSearchQueryDto {
  @ApiPropertyOptional({ enum: LocationTypeDto, description: 'Filter by location type' })
  @IsOptional()
  @IsEnum(LocationTypeDto)
  type?: LocationTypeDto;

  @ApiPropertyOptional({ description: 'Search keyword' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: 'Latitude for proximity search' })
  @IsOptional()
  @IsLatitude()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude for proximity search' })
  @IsOptional()
  @IsLongitude()
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Search radius in km', minimum: 0.1, maximum: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(50)
  @Type(() => Number)
  radius?: number;

  @ApiPropertyOptional({ description: 'Number of locations to return', minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Number of locations to skip', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offset?: number;
}

export class NearbyLocationQueryDto {
  @ApiProperty({ description: 'Latitude coordinate' })
  @IsLatitude()
  @Type(() => Number)
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  @IsLongitude()
  @Type(() => Number)
  longitude: number;

  @ApiPropertyOptional({ description: 'Search radius in km', minimum: 0.1, maximum: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(50)
  @Type(() => Number)
  radius?: number;

  @ApiPropertyOptional({ description: 'Number of locations to return', minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}

export class LocationListResponseDto {
  @ApiProperty({ type: [EcoLocationResponseDto], description: 'List of locations' })
  locations: EcoLocationResponseDto[];

  @ApiProperty({ description: 'Total number of locations' })
  total: number;

  @ApiProperty({ description: 'Whether there are more locations' })
  hasNext: boolean;
}

export class LocationReviewDto {
  @ApiProperty({ description: 'Review ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'User name' })
  userName: string;

  @ApiPropertyOptional({ description: 'User profile image URL' })
  userProfileImage?: string;

  @ApiProperty({ description: 'Rating (1-5)' })
  rating: number;

  @ApiProperty({ description: 'Review comment' })
  comment: string;

  @ApiProperty({ description: 'Review creation date' })
  createdAt: Date;
}

export class CreateLocationReviewDto {
  @ApiProperty({ description: 'Rating (1-5)', minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Review comment' })
  @IsString()
  comment: string;
}

export class LocationReviewListResponseDto {
  @ApiProperty({ type: [LocationReviewDto], description: 'List of reviews' })
  reviews: LocationReviewDto[];

  @ApiProperty({ description: 'Average rating' })
  averageRating: number;

  @ApiProperty({ description: 'Total number of reviews' })
  total: number;

  @ApiProperty({ description: 'Whether there are more reviews' })
  hasNext: boolean;
}