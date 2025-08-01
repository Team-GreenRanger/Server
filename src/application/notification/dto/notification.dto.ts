import { IsBoolean, IsOptional, IsNumber, Min, Max, IsEnum, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum NotificationTypeDto {
  MISSION_COMPLETED = 'MISSION_COMPLETED',
  MISSION_VERIFIED = 'MISSION_VERIFIED',
  MISSION_REJECTED = 'MISSION_REJECTED',
  REWARD_EARNED = 'REWARD_EARNED',
  LEVEL_UP = 'LEVEL_UP',
  CARBON_CREDIT_EARNED = 'CARBON_CREDIT_EARNED',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
}

export enum NotificationStatusDto {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
}

export class NotificationResponseDto {
  @ApiProperty({ description: 'Notification ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ enum: NotificationTypeDto, description: 'Notification type' })
  type: NotificationTypeDto;

  @ApiProperty({ description: 'Notification title' })
  title: string;

  @ApiProperty({ description: 'Notification message' })
  message: string;

  @ApiPropertyOptional({ description: 'Related entity ID (mission, reward, etc.)' })
  relatedId?: string;

  @ApiProperty({ enum: NotificationStatusDto, description: 'Notification status' })
  status: NotificationStatusDto;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Read date' })
  readAt?: Date;
}

export class NotificationListQueryDto {
  @ApiPropertyOptional({ enum: NotificationStatusDto, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(NotificationStatusDto)
  status?: NotificationStatusDto;

  @ApiPropertyOptional({ enum: NotificationTypeDto, description: 'Filter by type' })
  @IsOptional()
  @IsEnum(NotificationTypeDto)
  type?: NotificationTypeDto;

  @ApiPropertyOptional({ description: 'Number of notifications to return', minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Number of notifications to skip', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offset?: number;
}

export class NotificationListResponseDto {
  @ApiProperty({ type: [NotificationResponseDto], description: 'List of notifications' })
  notifications: NotificationResponseDto[];

  @ApiProperty({ description: 'Total number of notifications' })
  total: number;

  @ApiProperty({ description: 'Number of unread notifications' })
  unreadCount: number;

  @ApiProperty({ description: 'Whether there are more notifications' })
  hasNext: boolean;
}

export class MarkNotificationReadDto {
  @ApiProperty({ description: 'Whether to mark as read or unread' })
  @IsBoolean()
  isRead: boolean;
}

export class NotificationSettingsDto {
  @ApiProperty({ description: 'Enable mission completion notifications' })
  @IsBoolean()
  missionNotifications: boolean;

  @ApiProperty({ description: 'Enable reward notifications' })
  @IsBoolean()
  rewardNotifications: boolean;

  @ApiProperty({ description: 'Enable level up notifications' })
  @IsBoolean()
  levelUpNotifications: boolean;

  @ApiProperty({ description: 'Enable system announcements' })
  @IsBoolean()
  systemNotifications: boolean;

  @ApiProperty({ description: 'Enable email notifications' })
  @IsBoolean()
  emailNotifications: boolean;
}

export class NotificationSettingsResponseDto {
  @ApiProperty({ description: 'Enable mission completion notifications' })
  missionNotifications: boolean;

  @ApiProperty({ description: 'Enable reward notifications' })
  rewardNotifications: boolean;

  @ApiProperty({ description: 'Enable level up notifications' })
  levelUpNotifications: boolean;

  @ApiProperty({ description: 'Enable system announcements' })
  systemNotifications: boolean;

  @ApiProperty({ description: 'Enable email notifications' })
  emailNotifications: boolean;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}
