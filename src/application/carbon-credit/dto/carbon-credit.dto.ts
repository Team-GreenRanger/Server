import { IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum TransactionTypeDto {
  EARNED = 'EARNED',
  SPENT = 'SPENT',
  REFUNDED = 'REFUNDED',
}

export enum TransactionStatusDto {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export class CarbonCreditBalanceResponseDto {
  @ApiProperty({ description: 'Current carbon credit balance' })
  balance: number;

  @ApiProperty({ description: 'Total carbon credits earned' })
  totalEarned: number;

  @ApiProperty({ description: 'Total carbon credits spent' })
  totalSpent: number;

  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class CarbonCreditTransactionResponseDto {
  @ApiProperty({ description: 'Transaction ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ enum: TransactionTypeDto, description: 'Transaction type' })
  type: TransactionTypeDto;

  @ApiProperty({ description: 'Transaction amount' })
  amount: number;

  @ApiProperty({ description: 'Transaction description' })
  description: string;

  @ApiProperty({ description: 'Source type (MISSION, REWARD, etc.)' })
  sourceType: string;

  @ApiPropertyOptional({ description: 'Source ID' })
  sourceId?: string;

  @ApiProperty({ enum: TransactionStatusDto, description: 'Transaction status' })
  status: TransactionStatusDto;

  @ApiProperty({ description: 'Transaction creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Transaction update date' })
  updatedAt: Date;
}

export class TransactionHistoryQueryDto {
  @ApiPropertyOptional({ enum: TransactionTypeDto, description: 'Filter by transaction type' })
  @IsOptional()
  @IsEnum(TransactionTypeDto)
  type?: TransactionTypeDto;

  @ApiPropertyOptional({ description: 'Number of transactions to return', minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Number of transactions to skip', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offset?: number;
}

export class TransactionHistoryResponseDto {
  @ApiProperty({ type: [CarbonCreditTransactionResponseDto], description: 'List of transactions' })
  transactions: CarbonCreditTransactionResponseDto[];

  @ApiProperty({ description: 'Total number of transactions' })
  total: number;

  @ApiProperty({ description: 'Whether there are more transactions' })
  hasNext: boolean;
}

export class CarbonCreditStatisticsResponseDto {
  @ApiProperty({ description: 'Current balance' })
  currentBalance: number;

  @ApiProperty({ description: 'Total earned this month' })
  thisMonthEarned: number;

  @ApiProperty({ description: 'Total spent this month' })
  thisMonthSpent: number;

  @ApiProperty({ description: 'Average daily earnings (last 30 days)' })
  averageDailyEarnings: number;

  @ApiProperty({ description: 'Most frequent earning source' })
  topEarningSource: string;

  @ApiProperty({ description: 'Carbon credit ranking among all users' })
  globalRanking: number;
}
