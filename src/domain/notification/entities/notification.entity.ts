import { v4 as uuidv4 } from 'uuid';

export enum NotificationType {
  MISSION_COMPLETED = 'MISSION_COMPLETED',
  CARBON_CREDIT_EARNED = 'CARBON_CREDIT_EARNED',
  REWARD_EARNED = 'REWARD_EARNED',
  LEVEL_UP = 'LEVEL_UP',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
  REMINDER = 'REMINDER',
}

export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
}

export class Notification {
  private constructor(
    private readonly _id: string,
    private readonly _userId: string,
    private readonly _type: NotificationType,
    private readonly _title: string,
    private readonly _message: string,
    private readonly _relatedId?: string,
    private _status: NotificationStatus = NotificationStatus.UNREAD,
    private readonly _createdAt: Date = new Date(),
    private _readAt?: Date,
  ) {}

  public static create(props: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    relatedId?: string;
  }): Notification {
    return new Notification(
      uuidv4(),
      props.userId,
      props.type,
      props.title,
      props.message,
      props.relatedId,
    );
  }

  public static reconstitute(props: {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    relatedId?: string;
    status: NotificationStatus;
    createdAt: Date;
    readAt?: Date;
  }): Notification {
    return new Notification(
      props.id,
      props.userId,
      props.type,
      props.title,
      props.message,
      props.relatedId,
      props.status,
      props.createdAt,
      props.readAt,
    );
  }

  // Getters
  public get id(): string {
    return this._id;
  }

  public get userId(): string {
    return this._userId;
  }

  public get type(): NotificationType {
    return this._type;
  }

  public get title(): string {
    return this._title;
  }

  public get message(): string {
    return this._message;
  }

  public get relatedId(): string | undefined {
    return this._relatedId;
  }

  public get status(): NotificationStatus {
    return this._status;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get readAt(): Date | undefined {
    return this._readAt;
  }

  // Business Methods
  public markAsRead(): void {
    if (this._status === NotificationStatus.UNREAD) {
      this._status = NotificationStatus.READ;
      this._readAt = new Date();
    }
  }

  public archive(): void {
    this._status = NotificationStatus.ARCHIVED;
  }

  public isUnread(): boolean {
    return this._status === NotificationStatus.UNREAD;
  }

  public isRead(): boolean {
    return this._status === NotificationStatus.READ;
  }
}