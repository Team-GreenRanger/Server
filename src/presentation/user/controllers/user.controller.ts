import { 
  Controller, 
  Get, 
  Patch, 
  Delete,
  Body, 
  UseGuards,
  Request,
  Inject,
  NotFoundException
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { 
  UserProfileResponseDto,
  UpdateUserProfileDto,
  ChangePasswordDto,
  DeactivateAccountDto,
  UserStatisticsResponseDto
} from '../../../application/user/dto/user.dto';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/user/repositories/user.repository.interface';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'User profile information', 
    type: UserProfileResponseDto 
  })
  async getProfile(@Request() req: any): Promise<UserProfileResponseDto> {
    const userId = req.user.sub;
    
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      profileImageUrl: user.profileImageUrl,
      isVerified: user.isVerified,
      status: user.isActive ? 'ACTIVE' : 'INACTIVE',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'Profile updated successfully', 
    type: UserProfileResponseDto 
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  async updateProfile(
    @Request() req: any,
    @Body() updateProfileDto: UpdateUserProfileDto
  ): Promise<UserProfileResponseDto> {
    const userId = req.user.sub;
    
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.updateProfile(
      updateProfileDto.name || user.name,
      updateProfileDto.profileImageUrl || user.profileImageUrl
    );

    const updatedUser = await this.userRepository.save(user);
    
    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      profileImageUrl: updatedUser.profileImageUrl,
      isVerified: updatedUser.isVerified,
      status: updatedUser.isActive ? 'ACTIVE' : 'INACTIVE',
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }

  @Patch('change-password')
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiBadRequestResponse({ description: 'Invalid current password' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async changePassword(
    @Request() req: any,
    @Body() changePasswordDto: ChangePasswordDto
  ): Promise<{ message: string }> {
    const userId = req.user.sub;
    
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // TODO: 실제 비밀번호 검증 및 해싱 로직 구현
    
    return { message: 'Password changed successfully' };
  }

  @Delete('deactivate')
  @ApiOperation({ summary: 'Deactivate user account' })
  @ApiResponse({ status: 200, description: 'Account deactivated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid password' })
  async deactivateAccount(
    @Request() req: any,
    @Body() deactivateDto: DeactivateAccountDto
  ): Promise<{ message: string }> {
    const userId = req.user.sub;
    
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.deactivate();
    await this.userRepository.save(user);
    
    return { message: 'Account deactivated successfully' };
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'User statistics', 
    type: UserStatisticsResponseDto 
  })
  async getStatistics(@Request() req: any): Promise<UserStatisticsResponseDto> {
    const userId = req.user.sub;
    
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // TODO: 실제 통계 데이터 계산 로직 구현
    const daysSinceJoined = Math.floor((new Date().getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      totalMissionsCompleted: 15,
      currentCarbonCredits: 4400,
      totalCo2Reduction: 125.5,
      currentLevel: 3,
      daysSinceJoined,
      globalRanking: 1,
    };
  }
}
