import { 
  Controller, 
  Get, 
  Patch, 
  Delete,
  Body, 
  UseGuards,
  Request,
  Inject,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../../../domain/user/repositories/user.repository.interface';
import type { IMissionRepository, IUserMissionRepository } from '../../../domain/mission/repositories/mission.repository.interface';
import { MISSION_REPOSITORY, USER_MISSION_REPOSITORY } from '../../../domain/mission/repositories/mission.repository.interface';
import type { ICarbonCreditRepository } from '../../../domain/carbon-credit/repositories/carbon-credit.repository.interface';
import { CARBON_CREDIT_REPOSITORY } from '../../../domain/carbon-credit/repositories/carbon-credit.repository.interface';
import type { IRankingRepository } from '../../../domain/ranking/repositories/ranking.repository.interface';
import { RANKING_REPOSITORY } from '../../../domain/ranking/repositories/ranking.repository.interface';
import { RankingType, RankingPeriod, RankingScope } from '../../../domain/ranking/entities/ranking-snapshot.entity';
import { 
  UserProfileResponseDto,
  UpdateUserProfileDto,
  ChangePasswordDto,
  DeactivateAccountDto,
  UserStatisticsResponseDto,
  UserStatusDto
} from '../../../application/user/dto/user.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(MISSION_REPOSITORY)
    private readonly missionRepository: IMissionRepository,
    @Inject(USER_MISSION_REPOSITORY)
    private readonly userMissionRepository: IUserMissionRepository,
    @Inject(CARBON_CREDIT_REPOSITORY)
    private readonly carbonCreditRepository: ICarbonCreditRepository,
    @Inject(RANKING_REPOSITORY)
    private readonly rankingRepository: IRankingRepository,
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
      isAdmin: user.isAdmin,
      status: user.isActive ? UserStatusDto.ACTIVE : UserStatusDto.INACTIVE,
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
      isAdmin: updatedUser.isAdmin,
      status: updatedUser.isActive ? UserStatusDto.ACTIVE : UserStatusDto.INACTIVE,
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
    
    // 현재 비밀번호 검증
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword, 
      user.hashedPassword
    );
    
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }
    
    // 새 비밀번호 해싱
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, saltRounds);
    
    // 비밀번호 변경
    user.changePassword(hashedNewPassword);
    await this.userRepository.save(user);
    
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

    // 비밀번호 확인
    if (deactivateDto.password) {
      const isPasswordValid = await bcrypt.compare(
        deactivateDto.password, 
        user.hashedPassword
      );
      
      if (!isPasswordValid) {
        throw new BadRequestException('Invalid password');
      }
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
    
    // 병렬로 모든 데이터 조회
    const [user, totalMissionsCompleted, completedUserMissions, carbonCredit] = await Promise.all([
      this.userRepository.findById(userId),
      this.userMissionRepository.countCompletedMissions(userId),
      this.userMissionRepository.findCompletedMissionsByUserId(userId),
      this.carbonCreditRepository.findByUserId(userId)
    ]);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // 완료된 미션들의 CO2 감소량을 병렬로 계산
    const missionPromises = completedUserMissions.map(userMission => 
      this.missionRepository.findById(userMission.missionId)
    );
    const missions = await Promise.all(missionPromises);
    
    const totalCo2ReductionNum = missions.reduce((total, mission) => {
      return total + (mission ? mission.co2ReductionAmount : 0);
    }, 0);
    
    // CO2 감소량을 문자열로 포맷팅 (kg 단위, 소수점 2자리)
    const totalCo2Reduction = totalCo2ReductionNum.toFixed(2);
    
    const currentCarbonCredits = carbonCredit ? carbonCredit.balance : 0;
    
    return {
      totalMissionsCompleted,
      currentCarbonCredits,
      totalCo2Reduction,
      totalMissionSolved: user.totalMissionSolved,
    };
  }
}
