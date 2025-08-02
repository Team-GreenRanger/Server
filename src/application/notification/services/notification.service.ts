import { Injectable, Inject } from '@nestjs/common';
import { NotificationTypeDto } from '../dto/notification.dto';
import type { INotificationRepository } from '../../../domain/notification/repositories/notification.repository.interface';
import { NOTIFICATION_REPOSITORY } from '../../../domain/notification/repositories/notification.repository.interface';
import { Notification, NotificationType } from '../../../domain/notification/entities/notification.entity';

export interface CreateNotificationRequest {
  userId: string;
  type: NotificationTypeDto;
  title: string;
  message: string;
  relatedId?: string;
}

@Injectable()
export class NotificationService {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
  ) {}
  
  async createNotification(request: CreateNotificationRequest): Promise<void> {
    const notification = Notification.create({
      userId: request.userId,
      type: request.type as unknown as NotificationType,
      title: request.title,
      message: request.message,
      relatedId: request.relatedId,
    });

    await this.notificationRepository.save(notification);
  }

  async createMissionCompletedNotification(userId: string, missionTitle: string, creditEarned: number): Promise<void> {
    await this.createNotification({
      userId,
      type: 'MISSION_COMPLETED' as any,
      title: '미션 완료!',
      message: `"${missionTitle}" 미션을 완료하여 ${creditEarned} 탄소 크레딧을 획득했습니다.`,
    });
  }

  async createCarbonCreditEarnedNotification(userId: string, amount: number, source: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'CARBON_CREDIT_EARNED' as any,
      title: '탄소 크레딧 획득',
      message: `${source}를 통해 ${amount} 탄소 크레딧을 획득했습니다!`,
    });
  }

  async createRewardEarnedNotification(userId: string, rewardName: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'REWARD_EARNED' as any,
      title: '리워드 획득',
      message: `"${rewardName}" 리워드를 획득했습니다!`,
    });
  }

  async createLevelUpNotification(userId: string, newLevel: number): Promise<void> {
    await this.createNotification({
      userId,
      type: 'LEVEL_UP' as any,
      title: '레벨 업!',
      message: `축하합니다! 레벨 ${newLevel}로 올라갔습니다.`,
    });
  }

  async createSystemAnnouncementNotification(userId: string, title: string, message: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'SYSTEM_ANNOUNCEMENT' as any,
      title,
      message,
    });
  }
}
