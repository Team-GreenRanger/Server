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
import { 
  RewardResponseDto,
  RewardListQueryDto,
  RewardListResponseDto,
  RedeemRewardDto,
  UserRewardResponseDto,
  UserRewardListQueryDto,
  UserRewardListResponseDto,
  CreateRewardDto,
  UpdateRewardDto
} from '../../../application/reward/dto/reward.dto';

@ApiTags('Rewards')
@Controller('rewards')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RewardController {
  constructor() {}

  @Get()
  @ApiOperation({ summary: 'Get available rewards' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of available rewards', 
    type: RewardListResponseDto 
  })
  async getRewards(@Query() queryDto: RewardListQueryDto): Promise<RewardListResponseDto> {
    // TODO: Implement get rewards use case
    
    // Mock data for now
    return {
      rewards: [
        {
          id: '1',
          name: '스타벅스 기프트카드 5,000원',
          description: '친환경 컵 사용 권장 스타벅스 기프트카드',
          type: 'GIFT_CARD' as any,
          cost: 500,
          imageUrl: 'https://example.com/starbucks.jpg',
          availableQuantity: 100,
          status: 'AVAILABLE' as any,
          createdAt: new Date(),
        },
        {
          id: '2',
          name: '친환경 텀블러',
          description: '재사용 가능한 스테인리스 텀블러',
          type: 'ECO_PRODUCT' as any,
          cost: 800,
          imageUrl: 'https://example.com/tumbler.jpg',
          availableQuantity: 50,
          status: 'AVAILABLE' as any,
          createdAt: new Date(),
        },
      ],
      total: 2,
      hasNext: false,
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
    // TODO: Implement get reward by ID use case
    
    return {
      id,
      name: '스타벅스 기프트카드 5,000원',
      description: '친환경 컵 사용 권장 스타벅스 기프트카드',
      type: 'GIFT_CARD' as any,
      cost: 500,
      imageUrl: 'https://example.com/starbucks.jpg',
      availableQuantity: 100,
      status: 'AVAILABLE' as any,
      createdAt: new Date(),
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
    // TODO: Implement redeem reward use case
    const userId = req.user.sub;
    
    return {
      id: 'user-reward-1',
      userId,
      rewardId: redeemDto.rewardId,
      creditCost: 500,
      status: 'PENDING' as any,
      redemptionCode: 'RW' + Date.now(),
      deliveryAddress: redeemDto.deliveryAddress,
      redeemedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
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
    // TODO: Implement get user rewards use case
    const userId = req.user.sub;
    
    // Mock data for now
    return {
      userRewards: [
        {
          id: 'user-reward-1',
          userId,
          rewardId: '1',
          creditCost: 500,
          status: 'CONFIRMED' as any,
          redemptionCode: 'RW1234567890',
          redeemedAt: new Date(Date.now() - 86400000), // 1 day ago
          expiresAt: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000), // 29 days
          reward: {
            id: '1',
            name: '스타벅스 기프트카드 5,000원',
            description: '친환경 컵 사용 권장 스타벅스 기프트카드',
            type: 'GIFT_CARD' as any,
            cost: 500,
            imageUrl: 'https://example.com/starbucks.jpg',
            availableQuantity: 100,
            status: 'AVAILABLE' as any,
            createdAt: new Date(),
          },
        },
      ],
      total: 1,
      hasNext: false,
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
    // TODO: Implement get user reward by ID use case
    const userId = req.user.sub;
    
    return {
      id,
      userId,
      rewardId: '1',
      creditCost: 500,
      status: 'CONFIRMED' as any,
      redemptionCode: 'RW1234567890',
      redeemedAt: new Date(Date.now() - 86400000),
      expiresAt: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000),
      reward: {
        id: '1',
        name: '스타벅스 기프트카드 5,000원',
        description: '친환경 컵 사용 권장 스타벅스 기프트카드',
        type: 'GIFT_CARD' as any,
        cost: 500,
        imageUrl: 'https://example.com/starbucks.jpg',
        availableQuantity: 100,
        status: 'AVAILABLE' as any,
        createdAt: new Date(),
      },
    };
  }

  // Admin endpoints
  @Post('admin/create')
  @ApiOperation({ summary: 'Create new reward (Admin only)' })
  @ApiResponse({ 
    status: 201, 
    description: 'Reward created successfully', 
    type: RewardResponseDto 
  })
  @ApiBadRequestResponse({ description: 'Invalid reward data' })
  async createReward(@Body() createRewardDto: CreateRewardDto): Promise<RewardResponseDto> {
    // TODO: Implement create reward use case
    
    return {
      id: 'reward-' + Date.now(),
      name: createRewardDto.name,
      description: createRewardDto.description,
      type: createRewardDto.type,
      cost: createRewardDto.cost,
      imageUrl: createRewardDto.imageUrl,
      availableQuantity: createRewardDto.availableQuantity,
      status: 'AVAILABLE' as any,
      expiryDate: createRewardDto.expiryDate,
      createdAt: new Date(),
    };
  }

  @Put('admin/:id')
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
    // TODO: Implement update reward use case
    
    return {
      id,
      name: updateRewardDto.name || '스타벅스 기프트카드 5,000원',
      description: updateRewardDto.description || '친환경 컵 사용 권장 스타벅스 기프트카드',
      type: 'GIFT_CARD' as any,
      cost: updateRewardDto.cost || 500,
      imageUrl: updateRewardDto.imageUrl || 'https://example.com/starbucks.jpg',
      availableQuantity: updateRewardDto.availableQuantity || 100,
      status: updateRewardDto.status || 'AVAILABLE' as any,
      expiryDate: updateRewardDto.expiryDate,
      createdAt: new Date(),
    };
  }

  @Delete('admin/:id')
  @ApiOperation({ summary: 'Delete reward (Admin only)' })
  @ApiParam({ name: 'id', description: 'Reward ID' })
  @ApiResponse({ status: 200, description: 'Reward deleted successfully' })
  @ApiNotFoundResponse({ description: 'Reward not found' })
  async deleteReward(@Param('id') id: string): Promise<{ message: string }> {
    // TODO: Implement delete reward use case
    
    return { message: 'Reward deleted successfully' };
  }
}
