import { IsString, IsOptional, IsArray, IsEnum, IsNumber, Min, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum MissionTypeDto {
  ENERGY_SAVING = 'ENERGY_SAVING',
  TRANSPORTATION = 'TRANSPORTATION',
  WASTE_REDUCTION = 'WASTE_REDUCTION',
  RECYCLING = 'RECYCLING',
  WATER_CONSERVATION = 'WATER_CONSERVATION',
  SUSTAINABLE_CONSUMPTION = 'SUSTAINABLE_CONSUMPTION',
}

export enum MissionStatusDto {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  INACTIVE = 'INACTIVE',
}

export enum DifficultyLevelDto {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum UserMissionStatusDto {
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
}

export class MissionResponseDto {
  @ApiProperty({ description: 'Mission ID' })
  id: string;

  @ApiProperty({ description: 'Mission title' })
  title: string;

  @ApiProperty({ description: 'Mission description' })
  description: string;

  @ApiProperty({ enum: MissionTypeDto, description: 'Mission type' })
  type: MissionTypeDto;

  @ApiProperty({ enum: DifficultyLevelDto, description: 'Difficulty level' })
  difficulty: DifficultyLevelDto;

  @ApiProperty({ description: 'CO2 reduction amount in kg' })
  co2ReductionAmount: number;

  @ApiProperty({ description: 'Credit reward amount' })
  creditReward: number;

  @ApiProperty({ description: 'Required number of submissions to complete' })
  requiredSubmissions: number;

  @ApiPropertyOptional({ description: 'Mission image URL' })
  imageUrl?: string;

  @ApiProperty({ type: [String], description: 'Mission instructions' })
  instructions: string[];

  @ApiProperty({ type: [String], description: 'Verification criteria' })
  verificationCriteria: string[];

  @ApiProperty({ enum: MissionStatusDto, description: 'Mission status' })
  status: MissionStatusDto;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;
}

export class UserMissionResponseDto {
  @ApiProperty({ description: 'User mission ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Mission ID' })
  missionId: string;

  @ApiProperty({ enum: UserMissionStatusDto, description: 'User mission status' })
  status: UserMissionStatusDto;

  @ApiProperty({ description: 'Current progress' })
  currentProgress: number;

  @ApiProperty({ description: 'Target progress' })
  targetProgress: number;

  @ApiProperty({ type: [String], description: 'Submission image URLs' })
  submissionImageUrls: string[];

  @ApiPropertyOptional({ description: 'Submission note' })
  submissionNote?: string;

  @ApiPropertyOptional({ description: 'Verification note' })
  verificationNote?: string;

  @ApiPropertyOptional({ description: 'Submission date' })
  submittedAt?: Date;

  @ApiPropertyOptional({ description: 'Verification date' })
  verifiedAt?: Date;

  @ApiPropertyOptional({ description: 'Completion date' })
  completedAt?: Date;

  @ApiProperty({ description: 'Assignment date' })
  assignedAt: Date;

  @ApiProperty({ description: 'Whether mission is active (not completed)' })
  isActive: boolean;

  @ApiProperty({ description: 'Whether mission is done (completed)' })
  isDone: boolean;

  @ApiPropertyOptional({ description: 'Mission details' })
  mission?: MissionResponseDto;
}

export class AssignMissionDto {
  @ApiProperty({ description: 'Mission ID to assign' })
  @IsUUID()
  missionId: string;

  @ApiPropertyOptional({ description: 'Target progress (default: 1)', minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  targetProgress?: number;
}

export class SubmitMissionDto {
  @ApiProperty({ type: [String], description: 'Evidence image URLs' })
  @IsArray()
  @IsString({ each: true })
  imageUrls: string[];

  @ApiPropertyOptional({ description: 'Submission note' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class VerifyMissionDto {
  @ApiProperty({ description: 'Whether the mission is approved' })
  @IsString()
  @IsEnum(['approved', 'rejected'])
  decision: 'approved' | 'rejected';

  @ApiPropertyOptional({ description: 'Verification note' })
  @IsOptional()
  @IsString()
  verificationNote?: string;
}

export class CreateMissionDto {
  @ApiProperty({ description: 'Mission title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Mission description' })
  @IsString()
  description: string;

  @ApiProperty({ enum: MissionTypeDto, description: 'Mission type' })
  @IsEnum(MissionTypeDto)
  type: MissionTypeDto;

  @ApiProperty({ enum: DifficultyLevelDto, description: 'Difficulty level' })
  @IsEnum(DifficultyLevelDto)
  difficulty: DifficultyLevelDto;

  @ApiProperty({ description: 'CO2 reduction amount in kg' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  co2ReductionAmount: number;

  @ApiProperty({ description: 'Credit reward amount' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  creditReward: number;

  @ApiPropertyOptional({ description: 'Required number of submissions to complete', minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  requiredSubmissions?: number;

  @ApiPropertyOptional({ description: 'Mission image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ type: [String], description: 'Mission instructions' })
  @IsArray()
  @IsString({ each: true })
  instructions: string[];

  @ApiProperty({ type: [String], description: 'Verification criteria' })
  @IsArray()
  @IsString({ each: true })
  verificationCriteria: string[];
}
