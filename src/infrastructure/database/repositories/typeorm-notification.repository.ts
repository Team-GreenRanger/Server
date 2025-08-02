import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType, NotificationStatus } from '../../../domain/notification/entities/notification.entity';
import { INotificationRepository } from '../../../domain/notification/repositories/notification.repository.interface';
import { NotificationEntity, NotificationTypeEntity } from '../entities/notification.entity';

@Injectable()
export class TypeOrmNotificationRepository implements INotificationRepository {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
  ) {}

  async save(notification: Notification): Promise<Notification> {
    const notificationEntity = this.toEntity(notification);
    const savedEntity = await this.notificationRepository.save(notificationEntity);
    return this.toDomain(savedEntity);
  }

  async findById(id: string): Promise<Notification | null> {
    const entity = await this.notificationRepository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    const entities = await this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async findByUserIdAndStatus(userId: string, status: NotificationStatus): Promise<Notification[]> {
    const isRead = status === NotificationStatus.READ;
    const entities = await this.notificationRepository.find({
      where: { userId, isRead },
      order: { createdAt: 'DESC' },
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async findByUserIdAndType(userId: string, type: NotificationType): Promise<Notification[]> {
    const entities = await this.notificationRepository.find({
      where: { userId, type: this.mapDomainTypeToEntity(type) },
      order: { createdAt: 'DESC' },
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async markAsRead(id: string): Promise<void> {
    await this.notificationRepository.update(id, { isRead: true });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update({ userId }, { isRead: true });
  }

  async delete(id: string): Promise<void> {
    await this.notificationRepository.delete(id);
  }

  async countUnreadByUserId(userId: string): Promise<number> {
    return await this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  private toEntity(notification: Notification): NotificationEntity {
    const entity = new NotificationEntity();
    entity.id = notification.id;
    entity.userId = notification.userId;
    entity.type = this.mapDomainTypeToEntity(notification.type);
    entity.title = notification.title;
    entity.message = notification.message;
    entity.isRead = notification.status === NotificationStatus.READ;
    entity.createdAt = notification.createdAt;
    entity.updatedAt = notification.readAt || notification.createdAt;
    return entity;
  }

  private toDomain(entity: NotificationEntity): Notification {
    const status = entity.isRead ? NotificationStatus.READ : NotificationStatus.UNREAD;
    
    return Notification.reconstitute({
      id: entity.id,
      userId: entity.userId,
      type: this.mapEntityTypeToDomain(entity.type),
      title: entity.title,
      message: entity.message,
      status,
      createdAt: entity.createdAt,
      readAt: entity.isRead ? entity.updatedAt : undefined,
    });
  }

  private mapDomainTypeToEntity(type: NotificationType): NotificationTypeEntity {
    const typeMapping: Record<NotificationType, NotificationTypeEntity> = {
      [NotificationType.MISSION_COMPLETED]: NotificationTypeEntity.MISSION_COMPLETED,
      [NotificationType.CARBON_CREDIT_EARNED]: NotificationTypeEntity.CREDIT_EARNED,
      [NotificationType.REWARD_EARNED]: NotificationTypeEntity.REWARD_PURCHASED,
      [NotificationType.LEVEL_UP]: NotificationTypeEntity.RANKING_UPDATE,
      [NotificationType.SYSTEM_ANNOUNCEMENT]: NotificationTypeEntity.SYSTEM_ANNOUNCEMENT,
      [NotificationType.REMINDER]: NotificationTypeEntity.SYSTEM_ANNOUNCEMENT,
    };
    
    return typeMapping[type] || NotificationTypeEntity.SYSTEM_ANNOUNCEMENT;
  }

  private mapEntityTypeToDomain(type: NotificationTypeEntity): NotificationType {
    const typeMapping: Record<NotificationTypeEntity, NotificationType> = {
      [NotificationTypeEntity.MISSION_COMPLETED]: NotificationType.MISSION_COMPLETED,
      [NotificationTypeEntity.CREDIT_EARNED]: NotificationType.CARBON_CREDIT_EARNED,
      [NotificationTypeEntity.REWARD_PURCHASED]: NotificationType.REWARD_EARNED,
      [NotificationTypeEntity.RANKING_UPDATE]: NotificationType.LEVEL_UP,
      [NotificationTypeEntity.SYSTEM_ANNOUNCEMENT]: NotificationType.SYSTEM_ANNOUNCEMENT,
      [NotificationTypeEntity.MISSION_ASSIGNED]: NotificationType.SYSTEM_ANNOUNCEMENT,
      [NotificationTypeEntity.MISSION_VERIFIED]: NotificationType.SYSTEM_ANNOUNCEMENT,
      [NotificationTypeEntity.MISSION_REJECTED]: NotificationType.SYSTEM_ANNOUNCEMENT,
      [NotificationTypeEntity.REWARD_EXPIRING]: NotificationType.REMINDER,
    };
    
    return typeMapping[type] || NotificationType.SYSTEM_ANNOUNCEMENT;
  }
}
