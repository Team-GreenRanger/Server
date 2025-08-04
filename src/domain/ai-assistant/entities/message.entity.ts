import { v4 as uuidv4 } from 'uuid';

export enum MessageRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM',
}

export class Message {
  private constructor(
    private readonly _id: string,
    private readonly _conversationId: string,
    private readonly _role: MessageRole,
    private readonly _content: string,
    private readonly _metadata?: Record<string, any>,
    private readonly _createdAt: Date = new Date(),
  ) {}

  public static create(props: {
    conversationId: string;
    role: MessageRole;
    content: string;
    metadata?: Record<string, any>;
  }): Message {
    return new Message(
      uuidv4(),
      props.conversationId,
      props.role,
      props.content,
      props.metadata,
    );
  }

  public static reconstitute(props: {
    id: string;
    conversationId: string;
    role: MessageRole;
    content: string;
    metadata?: Record<string, any>;
    createdAt: Date;
  }): Message {
    return new Message(
      props.id,
      props.conversationId,
      props.role,
      props.content,
      props.metadata,
      props.createdAt,
    );
  }

  public get id(): string {
    return this._id;
  }

  public get conversationId(): string {
    return this._conversationId;
  }

  public get role(): MessageRole {
    return this._role;
  }

  public get content(): string {
    return this._content;
  }

  public get metadata(): Record<string, any> | undefined {
    return this._metadata ? { ...this._metadata } : undefined;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public isFromUser(): boolean {
    return this._role === MessageRole.USER;
  }

  public isFromAssistant(): boolean {
    return this._role === MessageRole.ASSISTANT;
  }

  public isSystemMessage(): boolean {
    return this._role === MessageRole.SYSTEM;
  }
}
