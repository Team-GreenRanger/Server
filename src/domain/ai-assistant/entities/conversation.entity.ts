import { v4 as uuidv4 } from 'uuid';

export enum ConversationStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
}

export class Conversation {
  private constructor(
    private readonly _id: string,
    private readonly _userId: string,
    private _title?: string,
    private _status: ConversationStatus = ConversationStatus.ACTIVE,
    private readonly _createdAt: Date = new Date(),
    private _updatedAt: Date = new Date(),
  ) {}

  public static create(props: {
    userId: string;
    title?: string;
  }): Conversation {
    return new Conversation(
      uuidv4(),
      props.userId,
      props.title,
    );
  }

  public static reconstitute(props: {
    id: string;
    userId: string;
    title?: string;
    status: ConversationStatus;
    createdAt: Date;
    updatedAt: Date;
  }): Conversation {
    return new Conversation(
      props.id,
      props.userId,
      props.title,
      props.status,
      props.createdAt,
      props.updatedAt,
    );
  }

  public get id(): string {
    return this._id;
  }

  public get userId(): string {
    return this._userId;
  }

  public get title(): string | undefined {
    return this._title;
  }

  public get status(): ConversationStatus {
    return this._status;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public updateTitle(title: string): void {
    this._title = title;
    this._updatedAt = new Date();
  }

  public archive(): void {
    this._status = ConversationStatus.ARCHIVED;
    this._updatedAt = new Date();
  }

  public delete(): void {
    this._status = ConversationStatus.DELETED;
    this._updatedAt = new Date();
  }

  public activate(): void {
    this._status = ConversationStatus.ACTIVE;
    this._updatedAt = new Date();
  }

  public isActive(): boolean {
    return this._status === ConversationStatus.ACTIVE;
  }

  public isDeleted(): boolean {
    return this._status === ConversationStatus.DELETED;
  }
}
