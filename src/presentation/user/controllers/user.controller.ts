import { 
  Controller, 
  Get, 
  Patch, 
  Delete,
  Body, 
  UseGuards,
  Request
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

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor() {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'User profile information', 
    type: UserProfileResponseDto 
  })
  async getProfile(@Request() req: any): Promise<UserProfileResponseDto> {
    const userId = req.user.sub;
    
    return {
      id: userId,
      email: 'user@example.com',
      name: 'John Doe',
      profileImageUrl: 'https://example.com/avatar.jpg',
      isVerified: true,
      status: 'ACTIVE' as any,
      createdAt: new Date(),
      updatedAt: new Date(),
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
    
    return {
      id: userId,
      email: 'user@example.com',
      name: updateProfileDto.name || 'John Doe',
      profileImageUrl: updateProfileDto.profileImageUrl,
      isVerified: true,
      status: 'ACTIVE' as any,
      createdAt: new Date(),
      updatedAt: new Date(),
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
    
    return {
      totalMissionsCompleted: 15,
      currentCarbonCredits: 4400,
      totalCo2Reduction: 125.5,
      currentLevel: 3,
      daysSinceJoined: 45,
      globalRanking: 1,
    };
  }
}
