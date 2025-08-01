import { v4 as uuidv4 } from 'uuid';

export enum TransactionType {
  EARNED = 'EARNED',     // 적립
  SPENT = 'SPENT',       // 사용
  REFUNDED = 'REFUNDED', // 환불
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export class CarbonCredit {
  private constructor(
    private readonly _id: string,
    private readonly _userId: string,
    private _balance: number = 0,
    private _totalEarned: number = 0,
    private _totalSpent: number = 0,
    private readonly _createdAt: Date = new Date(),
    private _updatedAt: Date = new Date(),
  ) {}

  public static create(userId: string): CarbonCredit {
    return new CarbonCredit(uuidv4(), userId);
  }

  public static reconstitute(props: {
    id: string;
    userId: string;
    balance: number;
    totalEarned: number;
    totalSpent: number;
    createdAt: Date;
    updatedAt: Date;
  }): CarbonCredit {
    return new CarbonCredit(
      props.id,
      props.userId,
      props.balance,
      props.totalEarned,
      props.totalSpent,
      props.createdAt,
      props.updatedAt,
    );
  }

  // Getters
  public get id(): string {
    return this._id;
  }

  public get userId(): string {
    return this._userId;
  }

  public get balance(): number {
    return this._balance;
  }

  public get totalEarned(): number {
    return this._totalEarned;
  }

  public get totalSpent(): number {
    return this._totalSpent;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business Methods
  public earn(amount: number): void {
    if (amount <= 0) {
      throw new Error('Earn amount must be positive');
    }
    this._balance += amount;
    this._totalEarned += amount;
    this._updatedAt = new Date();
  }

  public spend(amount: number): void {
    if (amount <= 0) {
      throw new Error('Spend amount must be positive');
    }
    if (this._balance < amount) {
      throw new Error('Insufficient balance');
    }
    this._balance -= amount;
    this._totalSpent += amount;
    this._updatedAt = new Date();
  }

  public refund(amount: number): void {
    if (amount <= 0) {
      throw new Error('Refund amount must be positive');
    }
    this._balance += amount;
    this._totalSpent -= amount;
    this._updatedAt = new Date();
  }

  public canSpend(amount: number): boolean {
    return this._balance >= amount;
  }
}

export class CarbonCreditTransaction {
  private constructor(
    private readonly _id: string,
    private readonly _userId: string,
    private readonly _type: TransactionType,
    private readonly _amount: number,
    private readonly _description: string,
    private readonly _sourceType: string, // 'MISSION', 'REWARD', 'REFUND', etc.
    private readonly _sourceId?: string,  // missionId, rewardId, etc.
    private _status: TransactionStatus = TransactionStatus.PENDING,
    private readonly _createdAt: Date = new Date(),
    private _updatedAt: Date = new Date(),
  ) {}

  public static create(props: {
    userId: string;
    type: TransactionType;
    amount: number;
    description: string;
    sourceType: string;
    sourceId?: string;
  }): CarbonCreditTransaction {
    return new CarbonCreditTransaction(
      uuidv4(),
      props.userId,
      props.type,
      props.amount,
      props.description,
      props.sourceType,
      props.sourceId,
    );
  }

  public static reconstitute(props: {
    id: string;
    userId: string;
    type: TransactionType;
    amount: number;
    description: string;
    sourceType: string;
    sourceId?: string;
    status: TransactionStatus;
    createdAt: Date;
    updatedAt: Date;
  }): CarbonCreditTransaction {
    return new CarbonCreditTransaction(
      props.id,
      props.userId,
      props.type,
      props.amount,
      props.description,
      props.sourceType,
      props.sourceId,
      props.status,
      props.createdAt,
      props.updatedAt,
    );
  }

  // Getters
  public get id(): string {
    return this._id;
  }

  public get userId(): string {
    return this._userId;
  }

  public get type(): TransactionType {
    return this._type;
  }

  public get amount(): number {
    return this._amount;
  }

  public get description(): string {
    return this._description;
  }

  public get sourceType(): string {
    return this._sourceType;
  }

  public get sourceId(): string | undefined {
    return this._sourceId;
  }

  public get status(): TransactionStatus {
    return this._status;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business Methods
  public complete(): void {
    if (this._status !== TransactionStatus.PENDING) {
      throw new Error('Transaction must be pending to complete');
    }
    this._status = TransactionStatus.COMPLETED;
    this._updatedAt = new Date();
  }

  public fail(): void {
    if (this._status !== TransactionStatus.PENDING) {
      throw new Error('Transaction must be pending to fail');
    }
    this._status = TransactionStatus.FAILED;
    this._updatedAt = new Date();
  }

  public cancel(): void {
    if (this._status !== TransactionStatus.PENDING) {
      throw new Error('Transaction must be pending to cancel');
    }
    this._status = TransactionStatus.CANCELLED;
    this._updatedAt = new Date();
  }

  public isPending(): boolean {
    return this._status === TransactionStatus.PENDING;
  }

  public isCompleted(): boolean {
    return this._status === TransactionStatus.COMPLETED;
  }
}
