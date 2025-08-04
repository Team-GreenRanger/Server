import { 
  Controller, 
  Get, 
  Query, 
  UseGuards,
  Request
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetCarbonCreditBalanceUseCase } from '../../../application/carbon-credit/use-cases/get-carbon-credit-balance.use-case';
import { GetTransactionHistoryUseCase } from '../../../application/carbon-credit/use-cases/get-transaction-history.use-case';
import { GetCarbonCreditStatisticsUseCase } from '../../../application/carbon-credit/use-cases/get-carbon-credit-statistics.use-case';
import { TransactionType } from '../../../domain/carbon-credit/entities/carbon-credit.entity';
import { 
  CarbonCreditBalanceResponseDto,
  TransactionHistoryQueryDto,
  TransactionHistoryResponseDto,
  CarbonCreditStatisticsResponseDto,
  CarbonCreditTransactionResponseDto,
  TransactionTypeDto,
  TransactionStatusDto
} from '../../../application/carbon-credit/dto/carbon-credit.dto';

@ApiTags('Carbon Credits')
@Controller('carbon-credits')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CarbonCreditController {
  constructor(
    private readonly getCarbonCreditBalanceUseCase: GetCarbonCreditBalanceUseCase,
    private readonly getTransactionHistoryUseCase: GetTransactionHistoryUseCase,
    private readonly getCarbonCreditStatisticsUseCase: GetCarbonCreditStatisticsUseCase,
  ) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get user carbon credit balance' })
  @ApiResponse({ 
    status: 200, 
    description: 'Carbon credit balance information', 
    type: CarbonCreditBalanceResponseDto 
  })
  async getBalance(@Request() req: any): Promise<CarbonCreditBalanceResponseDto> {
    const userId = req.user.sub;
    
    const result = await this.getCarbonCreditBalanceUseCase.execute({ userId });

    return {
      balance: result.balance,
      totalEarned: result.totalEarned,
      totalSpent: result.totalSpent,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get user transaction history' })
  @ApiResponse({ 
    status: 200, 
    description: 'Transaction history', 
    type: TransactionHistoryResponseDto 
  })
  async getTransactionHistory(
    @Request() req: any,
    @Query() queryDto: TransactionHistoryQueryDto,
  ): Promise<TransactionHistoryResponseDto> {
    const userId = req.user.sub;
    
    // Convert DTO enum to domain enum
    let transactionType: TransactionType | undefined;
    if (queryDto.type && Object.values(TransactionType).includes(queryDto.type as unknown as TransactionType)) {
      transactionType = queryDto.type as unknown as TransactionType;
    }
    
    const result = await this.getTransactionHistoryUseCase.execute({
      userId,
      type: transactionType,
      limit: queryDto.limit,
      offset: queryDto.offset,
    });

    return {
      transactions: result.transactions.map(transaction => ({
        id: transaction.id,
        userId: transaction.userId,
        type: transaction.type as unknown as TransactionTypeDto,
        amount: transaction.amount,
        description: transaction.description,
        sourceType: transaction.sourceType,
        sourceId: transaction.sourceId,
        status: transaction.status as unknown as TransactionStatusDto,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      })),
      total: result.total,
      hasNext: result.hasNext,
    };
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get user carbon credit statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Carbon credit statistics', 
    type: CarbonCreditStatisticsResponseDto 
  })
  async getStatistics(@Request() req: any): Promise<CarbonCreditStatisticsResponseDto> {
    const userId = req.user.sub;
    
    const result = await this.getCarbonCreditStatisticsUseCase.execute({ userId });

    return {
      currentBalance: result.currentBalance,
      thisMonthEarned: result.thisMonthEarned,
      thisMonthSpent: result.thisMonthSpent,
      averageDailyEarnings: result.averageDailyEarnings,
      topEarningSource: result.topEarningSource,
      globalRanking: result.globalRanking,
    };
  }
}
