import { IsEmail, IsString, IsOptional, MinLength, MaxLength, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserStatusDto {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DEACTIVATED = 'DEACTIVATED',
}

export class UserProfileResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'User full name' })
  name: string;

  @ApiPropertyOptional({ description: 'Profile image URL' })
  profileImageUrl?: string;

  @ApiProperty({ description: 'Email verification status' })
  isVerified: boolean;

  @ApiProperty({ description: 'Admin status' })
  isAdmin: boolean;

  @ApiProperty({ enum: UserStatusDto, description: 'User account status' })
  status: UserStatusDto;

  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class UpdateUserProfileDto {
  @ApiPropertyOptional({ example: 'John Doe', description: 'User full name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', description: 'Profile image URL' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  profileImageUrl?: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'currentPassword123', description: 'Current password' })
  @IsString()
  @MinLength(1)
  currentPassword: string;

  @ApiProperty({ example: 'newPassword123', description: 'New password', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword: string;
}

export class DeactivateAccountDto {
  @ApiProperty({ example: 'password123', description: 'User password for confirmation' })
  @IsString()
  @MinLength(1)
  password: string;

  @ApiPropertyOptional({ description: 'Reason for deactivation' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class UserStatisticsResponseDto {
  @ApiProperty({ description: 'Total missions completed' })
  totalMissionsCompleted: number;

  @ApiProperty({ description: 'Current carbon credit balance' })
  currentCarbonCredits: number;

  @ApiProperty({ description: 'Total CO2 reduction in kg' })
  totalCo2Reduction: string;

  @ApiProperty({ description: 'Total mission solved count' })
  totalMissionSolved: number;
}
