import { 
  Controller, 
  Get, 
  Patch, 
  Param, 
  Body, 
  Query,
  UseGuards 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery 
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { Admin } from '../../auth/decorators/admin.decorator';
import { GetUsersUseCase } from '../../../application/user/use-cases/get-users.use-case';
import { UpdateUserUseCase } from '../../../application/user/use-cases/update-user.use-case';
import { GetDashboardStatsUseCase } from '../../../application/admin/use-cases/get-dashboard-stats.use-case';
import { 
  UserListQueryDto,
  UserListResponseDto,
  UserResponseDto,
  UpdateUserDto 
} from '../../../application/user/dto/admin-user.dto';
import { DashboardResponseDto } from '../../../application/admin/dto/dashboard.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@Admin()
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly getUsersUseCase: GetUsersUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly getDashboardStatsUseCase: GetDashboardStatsUseCase,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics (Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard statistics', 
    type: DashboardResponseDto 
  })
  async getDashboardStats(): Promise<DashboardResponseDto> {
    const result = await this.getDashboardStatsUseCase.execute();
    
    return {
      stats: result.stats,
      recentActivities: result.recentActivities,
    };
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users with pagination (Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of users with pagination', 
    type: UserListResponseDto 
  })
  async getUsers(@Query() query: UserListQueryDto): Promise<UserListResponseDto> {
    const result = await this.getUsersUseCase.execute({
      page: query.page,
      limit: query.limit,
      search: query.search,
      isActive: query.isActive,
      isAdmin: query.isAdmin,
    });

    return result;
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'User updated successfully', 
    type: UserResponseDto 
  })
  async updateUser(
    @Param('id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const result = await this.updateUserUseCase.execute({
      userId,
      name: updateUserDto.name,
      profileImageUrl: updateUserDto.profileImageUrl,
      isActive: updateUserDto.isActive,
      isAdmin: updateUserDto.isAdmin,
    });

    return result.user;
  }
}