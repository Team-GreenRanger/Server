import { 
  Controller, 
  Get, 
  Patch, 
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
  ApiBadRequestResponse
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { 
  NotificationResponseDto,
  NotificationListQueryDto,
  NotificationListResponseDto,
  MarkNotificationReadDto,
  NotificationSettingsDto,
  NotificationSettingsResponseDto
} from '../../../application/notification/dto/notification.dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor() {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of user notifications', 
    type: NotificationListResponseDto 
  })
  async getNotifications(
    @Request() req: any,
    @Query() queryDto: NotificationListQueryDto,
  ): Promise<NotificationListResponseDto> {
    const userId = req.user.sub;
    
    return {
      notifications: [
        {
          id: '1',
          userId,
          type: 'MISSION_COMPLETED' as any,
          title: '미션 완료!',
          message: '대중교통 이용하기 미션을 성공적으로 완료했습니다.',
          relatedId: 'mission-1',
          status: 'UNREAD' as any,
          createdAt: new Date(),
        },
        {
          id: '2',
          userId,
          type: 'CARBON_CREDIT_EARNED' as any,
          title: '탄소 크레딧 획득',
          message: '500 탄소 크레딧을 획득했습니다!',
          status: 'READ' as any,
          createdAt: new Date(Date.now() - 86400000),
          readAt: new Date(),
        },
      ],
      total: 2,
      unreadCount: 1,
      hasNext: false,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Notification details', 
    type: NotificationResponseDto 
  })
  async getNotificationById(
    @Request() req: any,
    @Param('id') id: string
  ): Promise<NotificationResponseDto> {
    const userId = req.user.sub;
    
    return {
      id,
      userId,
      type: 'MISSION_COMPLETED' as any,
      title: '미션 완료!',
      message: '대중교통 이용하기 미션을 성공적으로 완료했습니다.',
      relatedId: 'mission-1',
      status: 'UNREAD' as any,
      createdAt: new Date(),
    };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read/unread' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Notification status updated', 
    type: NotificationResponseDto 
  })
  async markNotificationRead(
    @Request() req: any,
    @Param('id') id: string,
    @Body() markReadDto: MarkNotificationReadDto,
  ): Promise<NotificationResponseDto> {
    const userId = req.user.sub;
    
    return {
      id,
      userId,
      type: 'MISSION_COMPLETED' as any,
      title: '미션 완료!',
      message: '대중교통 이용하기 미션을 성공적으로 완료했습니다.',
      relatedId: 'mission-1',
      status: markReadDto.isRead ? 'READ' as any : 'UNREAD' as any,
      createdAt: new Date(),
      readAt: markReadDto.isRead ? new Date() : undefined,
    };
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllNotificationsRead(@Request() req: any): Promise<{ message: string; count: number }> {
    const userId = req.user.sub;
    
    return { message: 'All notifications marked as read', count: 5 };
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get notification settings' })
  @ApiResponse({ 
    status: 200, 
    description: 'User notification settings', 
    type: NotificationSettingsResponseDto 
  })
  async getNotificationSettings(@Request() req: any): Promise<NotificationSettingsResponseDto> {
    const userId = req.user.sub;
    
    return {
      missionNotifications: true,
      rewardNotifications: true,
      levelUpNotifications: true,
      systemNotifications: true,
      emailNotifications: false,
      updatedAt: new Date(),
    };
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update notification settings' })
  @ApiResponse({ 
    status: 200, 
    description: 'Notification settings updated', 
    type: NotificationSettingsResponseDto 
  })
  @ApiBadRequestResponse({ description: 'Invalid settings data' })
  async updateNotificationSettings(
    @Request() req: any,
    @Body() settingsDto: NotificationSettingsDto,
  ): Promise<NotificationSettingsResponseDto> {
    const userId = req.user.sub;
    
    return {
      ...settingsDto,
      updatedAt: new Date(),
    };
  }
}
