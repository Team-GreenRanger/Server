import { 
  Controller, 
  Get, 
  Post,
  Put,
  Delete,
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
import { AdminGuard } from '../../auth/guards/admin.guard';
import { Admin } from '../../auth/decorators/admin.decorator';
import { 
  RewardResponseDto,
  RewardListQueryDto,
  RewardListResponseDto,
  RedeemRewardDto,
  UserRewardResponseDto,
  UserRewardListQueryDto,
  UserRewardListResponseDto,
  CreateRewardDto,
  UpdateRewardDto,
  RewardTypeDto,
  RewardStatusDto,
  UserRewardStatusDto
} from '../../../application/reward/dto/reward.dto';
import { GetRewardsUseCase } from '../../../application/reward/use-cases/get-rewards.use-case';
import { GetRewardByIdUseCase } from '../../../application/reward/use-cases/get-reward-by-id.use-case';
import { RedeemRewardUseCase } from '../../../application/reward/use-cases/redeem-reward.use-case';
import { GetUserRewardsUseCase } from '../../../application/reward/use-cases/get-user-rewards.use-case';
import { GetUserRewardByIdUseCase } from '../../../application/reward/use-cases/get-user-reward-by-id.use-case';
import { CreateRewardUseCase } from '../../../application/reward/use-cases/create-reward.use-case';
import { UpdateRewardUseCase } from '../../../application/reward/use-cases/update-reward.use-case';
import { DeleteRewardUseCase } from '../../../application/reward/use-cases/delete-reward.use-case';
import { RewardType, RewardStatus, UserRewardStatus } from '../../../domain/reward/entities/reward.entity';

@ApiTags('Rewards')
@Controller('rewards')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RewardController {
  constructor(
    private readonly getRewardsUseCase: GetRewardsUseCase,
    private readonly getRewardByIdUseCase: GetRewardByIdUseCase,
    private readonly redeemRewardUseCase: RedeemRewardUseCase,
    private readonly getUserRewardsUseCase: GetUserRewardsUseCase,
    private readonly getUserRewardByIdUseCase: GetUserRewardByIdUseCase,
    private readonly createRewardUseCase: CreateRewardUseCase,
    private readonly updateRewardUseCase: UpdateRewardUseCase,
    private readonly deleteRewardUseCase: DeleteRewardUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get available rewards' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of available rewards', 
    type: RewardListResponseDto 
  })
  async getRewards(@Query() queryDto: RewardListQueryDto): Promise<RewardListResponseDto> {
    const result = await this.getRewardsUseCase.execute({
      limit: queryDto.limit,
      offset: queryDto.offset,
    });

    return {
      rewards: result.rewards.map(reward => ({
        id: reward.id,
        name: reward.title,
        description: reward.description,
        type: this.mapRewardTypeToDto(reward.type),
        cost: reward.creditCost,
        imageUrl: reward.imageUrl,
        availableQuantity: reward.remainingQuantity || 0,
        status: this.mapRewardStatusToDto(reward.status),
        createdAt: reward.createdAt,
      })),
      total: result.total,
      hasNext: result.hasNext,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get reward by ID' })
  @ApiParam({ name: 'id', description: 'Reward ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Reward details', 
    type: RewardResponseDto 
  })
  @ApiNotFoundResponse({ description: 'Reward not found' })
  async getRewardById(@Param('id') id: string): Promise<RewardResponseDto> {
    const result = await this.getRewardByIdUseCase.execute({ id });
    const reward = result.reward;

    return {
      id: reward.id,
      name: reward.title,
      description: reward.description,
      type: this.mapRewardTypeToDto(reward.type),
      cost: reward.creditCost,
      imageUrl: reward.imageUrl,
      availableQuantity: reward.remainingQuantity || 0,
      status: this.mapRewardStatusToDto(reward.status),
      createdAt: reward.createdAt,
    };
  }

  @Post('redeem')
  @ApiOperation({ summary: 'Redeem reward with carbon credits' })
  @ApiResponse({ 
    status: 201, 
    description: 'Reward redeemed successfully', 
    type: UserRewardResponseDto 
  })
  @ApiBadRequestResponse({ description: 'Insufficient carbon credits or reward unavailable' })
  async redeemReward(
    @Request() req: any,
    @Body() redeemDto: RedeemRewardDto,
  ): Promise<UserRewardResponseDto> {
    const userId = req.user.sub;
    
    const result = await this.redeemRewardUseCase.execute({
      userId,
      rewardId: redeemDto.rewardId,
      deliveryAddress: redeemDto.deliveryAddress,
    });

    const userReward = result.userReward;
    // Get reward details for creditCost
    const rewardResult = await this.getRewardByIdUseCase.execute({ id: redeemDto.rewardId });

    return {
      id: userReward.id,
      userId: userReward.userId,
      rewardId: userReward.rewardId,
      creditCost: rewardResult.reward.creditCost,
      status: userReward.status as unknown as UserRewardStatusDto,
      redemptionCode: userReward.couponCode || '',
      deliveryAddress: redeemDto.deliveryAddress,
      redeemedAt: userReward.purchasedAt,
      expiresAt: userReward.expiresAt,
    };
  }

  @Get('user/my-rewards')
  @ApiOperation({ summary: 'Get current user redeemed rewards' })
  @ApiResponse({ 
    status: 200, 
    description: 'User redeemed rewards', 
    type: UserRewardListResponseDto 
  })
  async getUserRewards(
    @Request() req: any,
    @Query() queryDto: UserRewardListQueryDto,
  ): Promise<UserRewardListResponseDto> {
    const userId = req.user.sub;
    
    const result = await this.getUserRewardsUseCase.execute({
      userId,
      limit: queryDto.limit,
      offset: queryDto.offset,
    });

    return {
      userRewards: result.userRewards.map(item => ({
        id: item.userReward.id,
        userId: item.userReward.userId,
        rewardId: item.userReward.rewardId,
        creditCost: item.reward.creditCost,
        status: this.mapUserRewardStatusToDto(item.userReward.status),
        redemptionCode: item.userReward.couponCode || '',
        redeemedAt: item.userReward.purchasedAt,
        expiresAt: item.userReward.expiresAt,
        reward: {
          id: item.reward.id,
          name: item.reward.title,
          description: item.reward.description,
          type: item.reward.type,
          cost: item.reward.creditCost,
          imageUrl: item.reward.imageUrl,
          availableQuantity: item.reward.remainingQuantity || 0,
          status: item.reward.status,
          createdAt: item.reward.createdAt,
        },
      })),
      total: result.total,
      hasNext: result.hasNext,
    };
  }

  @Get('user/my-rewards/:id')
  @ApiOperation({ summary: 'Get user reward details by ID' })
  @ApiParam({ name: 'id', description: 'User reward ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'User reward details', 
    type: UserRewardResponseDto 
  })
  @ApiNotFoundResponse({ description: 'User reward not found' })
  async getUserRewardById(
    @Request() req: any,
    @Param('id') id: string
  ): Promise<UserRewardResponseDto> {
    const userId = req.user.sub;
    
    const result = await this.getUserRewardByIdUseCase.execute({
      userId,
      userRewardId: id,
    });

    return {
      id: result.userReward.id,
      userId: result.userReward.userId,
      rewardId: result.userReward.rewardId,
      creditCost: result.reward.creditCost,
      status: this.mapUserRewardStatusToDto(result.userReward.status),
      redemptionCode: result.userReward.couponCode || '',
      redeemedAt: result.userReward.purchasedAt,
      expiresAt: result.userReward.expiresAt,
      reward: {
        id: result.reward.id,
        name: result.reward.title,
        description: result.reward.description,
        type: result.reward.type,
        cost: result.reward.creditCost,
        imageUrl: result.reward.imageUrl,
        availableQuantity: 0,
        status: result.reward.status,
        createdAt: result.reward.createdAt,
      },
    };
  }

  // Admin endpoints
  @Post('admin/create')
  @Admin()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create new reward (Admin only)' })
  @ApiResponse({ 
    status: 201, 
    description: 'Reward created successfully', 
    type: RewardResponseDto 
  })
  @ApiBadRequestResponse({ description: 'Invalid reward data' })
  async createReward(@Body() createRewardDto: CreateRewardDto): Promise<RewardResponseDto> {
    const result = await this.createRewardUseCase.execute({
      title: createRewardDto.name,
      description: createRewardDto.description,
      type: this.mapRewardTypeFromDto(createRewardDto.type),
      creditCost: createRewardDto.cost,
      barcodeImageUrl: createRewardDto.barcodeImageUrl,
      originalPrice: createRewardDto.originalPrice,
      imageUrl: createRewardDto.imageUrl,
      partnerName: createRewardDto.partnerName,
      partnerLogoUrl: createRewardDto.partnerLogoUrl,
      termsAndConditions: createRewardDto.termsAndConditions,
      validityDays: createRewardDto.validityDays,
      totalQuantity: createRewardDto.totalQuantity,
    });

    const reward = result.reward;

    return {
      id: reward.id,
      name: reward.title,
      description: reward.description,
      type: this.mapRewardTypeToDto(reward.type),
      cost: reward.creditCost,
      imageUrl: reward.imageUrl,
      availableQuantity: reward.remainingQuantity || 0,
      status: this.mapRewardStatusToDto(reward.status),
      expiryDate: createRewardDto.expiryDate,
      createdAt: reward.createdAt,
    };
  }

  @Put('admin/:id')
  @Admin()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update reward (Admin only)' })
  @ApiParam({ name: 'id', description: 'Reward ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Reward updated successfully', 
    type: RewardResponseDto 
  })
  @ApiBadRequestResponse({ description: 'Invalid reward data' })
  @ApiNotFoundResponse({ description: 'Reward not found' })
  async updateReward(
    @Param('id') id: string,
    @Body() updateRewardDto: UpdateRewardDto
  ): Promise<RewardResponseDto> {
    const result = await this.updateRewardUseCase.execute({
      id,
      title: updateRewardDto.name,
      description: updateRewardDto.description,
      creditCost: updateRewardDto.cost,
      imageUrl: updateRewardDto.imageUrl,
      totalQuantity: updateRewardDto.totalQuantity,
      status: updateRewardDto.status as any,
    });

    const reward = result.reward;

    return {
      id: reward.id,
      name: reward.title,
      description: reward.description,
      type: this.mapRewardTypeToDto(reward.type),
      cost: reward.creditCost,
      imageUrl: reward.imageUrl,
      availableQuantity: reward.remainingQuantity || 0,
      status: this.mapRewardStatusToDto(reward.status),
      expiryDate: updateRewardDto.expiryDate,
      createdAt: reward.createdAt,
    };
  }

  @Delete('admin/:id')
  @Admin()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Delete reward (Admin only)' })
  @ApiParam({ name: 'id', description: 'Reward ID' })
  @ApiResponse({ status: 200, description: 'Reward deleted successfully' })
  @ApiNotFoundResponse({ description: 'Reward not found' })
  async deleteReward(@Param('id') id: string): Promise<{ message: string }> {
    const result = await this.deleteRewardUseCase.execute({ id });
    
    return { message: result.message };
  }

  // Helper methods for type mapping
  private mapRewardTypeToDto(domainType: RewardType): RewardTypeDto {
    const mapping = {
      [RewardType.DISCOUNT_COUPON]: RewardTypeDto.DISCOUNT_COUPON,
      [RewardType.GIFT_CARD]: RewardTypeDto.GIFT_CARD,
      [RewardType.PHYSICAL_ITEM]: RewardTypeDto.ECO_PRODUCT,
      [RewardType.EXPERIENCE]: RewardTypeDto.EXPERIENCE,
    };
    return mapping[domainType] || RewardTypeDto.ECO_PRODUCT;
  }

  private mapRewardTypeFromDto(dtoType: RewardTypeDto): RewardType {
    const mapping = {
      [RewardTypeDto.DISCOUNT_COUPON]: RewardType.DISCOUNT_COUPON,
      [RewardTypeDto.GIFT_CARD]: RewardType.GIFT_CARD,
      [RewardTypeDto.ECO_PRODUCT]: RewardType.PHYSICAL_ITEM,
      [RewardTypeDto.EXPERIENCE]: RewardType.EXPERIENCE,
      [RewardTypeDto.DONATION]: RewardType.PHYSICAL_ITEM, // DONATION -> PHYSICAL_ITEM으로 매핑
    };
    return mapping[dtoType] || RewardType.PHYSICAL_ITEM;
  }

  private mapRewardStatusToDto(domainStatus: RewardStatus): RewardStatusDto {
    const mapping = {
      [RewardStatus.ACTIVE]: RewardStatusDto.AVAILABLE,
      [RewardStatus.INACTIVE]: RewardStatusDto.DISCONTINUED,
      [RewardStatus.OUT_OF_STOCK]: RewardStatusDto.OUT_OF_STOCK,
    };
    return mapping[domainStatus] || RewardStatusDto.AVAILABLE;
  }

  private mapUserRewardStatusToDto(domainStatus: UserRewardStatus): UserRewardStatusDto {
    const mapping = {
      [UserRewardStatus.PURCHASED]: UserRewardStatusDto.CONFIRMED,
      [UserRewardStatus.USED]: UserRewardStatusDto.DELIVERED,
      [UserRewardStatus.EXPIRED]: UserRewardStatusDto.EXPIRED,
      [UserRewardStatus.REFUNDED]: UserRewardStatusDto.CANCELLED,
    };
    return mapping[domainStatus] || UserRewardStatusDto.PENDING;
  }
}
