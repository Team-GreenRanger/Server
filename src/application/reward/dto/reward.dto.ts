import { IsUUID, IsOptional, IsNumber, Min, Max, IsEnum, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum RewardTypeDto {
  DISCOUNT_COUPON = 'DISCOUNT_COUPON',
  GIFT_CARD = 'GIFT_CARD',
  ECO_PRODUCT = 'ECO_PRODUCT',
  EXPERIENCE = 'EXPERIENCE',
  DONATION = 'DONATION',
}

export enum RewardStatusDto {
  AVAILABLE = 'AVAILABLE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED',
}

export enum UserRewardStatusDto {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  DELIVERED = 'DELIVERED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export class CreateRewardDto {
  @ApiProperty({ description: 'Reward name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Reward description' })
  @IsString()
  description: string;

  @ApiProperty({ enum: RewardTypeDto, description: 'Reward type' })
  @IsEnum(RewardTypeDto)
  type: RewardTypeDto;

  @ApiProperty({ description: 'Cost in carbon credits', minimum: 1 })
  @IsNumber()
  @Min(1)
  cost: number;

  @ApiProperty({ description: 'Barcode image URL' })
  @IsString()
  barcodeImageUrl: string;

  @ApiPropertyOptional({ description: 'Original price in currency' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  originalPrice?: number;

  @ApiPropertyOptional({ description: 'Reward image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Partner company name' })
  @IsOptional()
  @IsString()
  partnerName?: string;

  @ApiPropertyOptional({ description: 'Partner logo URL' })
  @IsOptional()
  @IsString()
  partnerLogoUrl?: string;

  @ApiPropertyOptional({ type: [String], description: 'Terms and conditions' })
  @IsOptional()
  termsAndConditions?: string[];

  @ApiPropertyOptional({ description: 'Validity period in days', minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  validityDays?: number;

  @ApiPropertyOptional({ description: 'Total available quantity' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalQuantity?: number;

  @ApiPropertyOptional({ description: 'Expiry date' })
  @IsOptional()
  expiryDate?: Date;
}

export class UpdateRewardDto {
  @ApiPropertyOptional({ description: 'Reward name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Reward description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Cost in carbon credits', minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  cost?: number;

  @ApiPropertyOptional({ description: 'Reward image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Total available quantity', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalQuantity?: number;

  @ApiPropertyOptional({ enum: RewardStatusDto, description: 'Reward status' })
  @IsOptional()
  @IsEnum(RewardStatusDto)
  status?: RewardStatusDto;

  @ApiPropertyOptional({ description: 'Expiry date' })
  @IsOptional()
  expiryDate?: Date;
}

export class RewardResponseDto {
  @ApiProperty({ description: 'Reward ID' })
  id: string;

  @ApiProperty({ description: 'Reward name' })
  name: string;

  @ApiProperty({ description: 'Reward description' })
  description: string;

  @ApiProperty({ enum: RewardTypeDto, description: 'Reward type' })
  type: RewardTypeDto;

  @ApiProperty({ description: 'Cost in carbon credits' })
  cost: number;

  @ApiPropertyOptional({ description: 'Reward image URL' })
  imageUrl?: string;

  @ApiProperty({ description: 'Available quantity' })
  availableQuantity: number;

  @ApiProperty({ enum: RewardStatusDto, description: 'Reward status' })
  status: RewardStatusDto;

  @ApiPropertyOptional({ description: 'Expiry date' })
  expiryDate?: Date;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;
}

export class UserRewardResponseDto {
  @ApiProperty({ description: 'User reward ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Reward ID' })
  rewardId: string;

  @ApiProperty({ description: 'Carbon credits spent' })
  creditCost: number;

  @ApiProperty({ enum: UserRewardStatusDto, description: 'User reward status' })
  status: UserRewardStatusDto;

  @ApiPropertyOptional({ description: 'Delivery/redemption code' })
  redemptionCode?: string;

  @ApiPropertyOptional({ description: 'Delivery address' })
  deliveryAddress?: string;

  @ApiPropertyOptional({ description: 'Delivery tracking number' })
  trackingNumber?: string;

  @ApiProperty({ description: 'Purchase/redemption date' })
  redeemedAt: Date;

  @ApiPropertyOptional({ description: 'Expiry date' })
  expiresAt?: Date;

  @ApiPropertyOptional({ description: 'Reward details' })
  reward?: RewardResponseDto;
}

export class RewardListQueryDto {
  @ApiPropertyOptional({ enum: RewardTypeDto, description: 'Filter by reward type' })
  @IsOptional()
  @IsEnum(RewardTypeDto)
  type?: RewardTypeDto;

  @ApiPropertyOptional({ enum: RewardStatusDto, description: 'Filter by reward status' })
  @IsOptional()
  @IsEnum(RewardStatusDto)
  status?: RewardStatusDto;

  @ApiPropertyOptional({ description: 'Maximum cost in carbon credits' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxCost?: number;

  @ApiPropertyOptional({ description: 'Number of rewards to return', minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Number of rewards to skip', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offset?: number;
}

export class RewardListResponseDto {
  @ApiProperty({ type: [RewardResponseDto], description: 'List of rewards' })
  rewards: RewardResponseDto[];

  @ApiProperty({ description: 'Total number of rewards' })
  total: number;

  @ApiProperty({ description: 'Whether there are more rewards' })
  hasNext: boolean;
}

export class RedeemRewardDto {
  @ApiProperty({ description: 'Reward ID to redeem' })
  @IsUUID()
  rewardId: string;

  @ApiPropertyOptional({ description: 'Delivery address (for physical rewards)' })
  @IsOptional()
  deliveryAddress?: string;
}

export class UserRewardListQueryDto {
  @ApiPropertyOptional({ enum: UserRewardStatusDto, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(UserRewardStatusDto)
  status?: UserRewardStatusDto;

  @ApiPropertyOptional({ description: 'Number of user rewards to return', minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Number of user rewards to skip', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offset?: number;
}

export class UserRewardListResponseDto {
  @ApiProperty({ type: [UserRewardResponseDto], description: 'List of user rewards' })
  userRewards: UserRewardResponseDto[];

  @ApiProperty({ description: 'Total number of user rewards' })
  total: number;

  @ApiProperty({ description: 'Whether there are more user rewards' })
  hasNext: boolean;
}
