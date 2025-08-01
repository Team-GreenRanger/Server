import { v4 as uuidv4 } from 'uuid';

export enum RewardType {
  DISCOUNT_COUPON = 'DISCOUNT_COUPON',   // 할인 쿠폰
  GIFT_CARD = 'GIFT_CARD',               // 기프트카드
  PHYSICAL_ITEM = 'PHYSICAL_ITEM',       // 실물 상품
  EXPERIENCE = 'EXPERIENCE',             // 체험 상품
}

export enum RewardStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}

export class Reward {
  private constructor(
    private readonly _id: string,
    private readonly _title: string,
    private readonly _description: string,
    private readonly _type: RewardType,
    private readonly _creditCost: number,
    private readonly _validityDays: number = 30, // 쿠폰 유효기간 (일)
    private readonly _originalPrice?: number,
    private readonly _imageUrl?: string,
    private readonly _partnerName?: string,
    private readonly _partnerLogoUrl?: string,
    private readonly _termsAndConditions: string[] = [],
    private _totalQuantity?: number,
    private _remainingQuantity?: number,
    private _status: RewardStatus = RewardStatus.ACTIVE,
    private readonly _createdAt: Date = new Date(),
    private _updatedAt: Date = new Date(),
  ) {}

  public static create(props: {
    title: string;
    description: string;
    type: RewardType;
    creditCost: number;
    originalPrice?: number;
    imageUrl?: string;
    partnerName?: string;
    partnerLogoUrl?: string;
    termsAndConditions?: string[];
    validityDays?: number;
    totalQuantity?: number;
  }): Reward {
    return new Reward(
      uuidv4(),
      props.title,
      props.description,
      props.type,
      props.creditCost,
      props.validityDays || 30,
      props.originalPrice,
      props.imageUrl,
      props.partnerName,
      props.partnerLogoUrl,
      props.termsAndConditions || [],
      props.totalQuantity,
      props.totalQuantity,
    );
  }

  public static reconstitute(props: {
    id: string;
    title: string;
    description: string;
    type: RewardType;
    creditCost: number;
    originalPrice?: number;
    imageUrl?: string;
    partnerName?: string;
    partnerLogoUrl?: string;
    termsAndConditions: string[];
    validityDays: number;
    totalQuantity?: number;
    remainingQuantity?: number;
    status: RewardStatus;
    createdAt: Date;
    updatedAt: Date;
  }): Reward {
    return new Reward(
      props.id,
      props.title,
      props.description,
      props.type,
      props.creditCost,
      props.validityDays,
      props.originalPrice,
      props.imageUrl,
      props.partnerName,
      props.partnerLogoUrl,
      props.termsAndConditions,
      props.totalQuantity,
      props.remainingQuantity,
      props.status,
      props.createdAt,
      props.updatedAt,
    );
  }

  // Getters
  public get id(): string {
    return this._id;
  }

  public get title(): string {
    return this._title;
  }

  public get description(): string {
    return this._description;
  }

  public get type(): RewardType {
    return this._type;
  }

  public get creditCost(): number {
    return this._creditCost;
  }

  public get originalPrice(): number | undefined {
    return this._originalPrice;
  }

  public get imageUrl(): string | undefined {
    return this._imageUrl;
  }

  public get partnerName(): string | undefined {
    return this._partnerName;
  }

  public get partnerLogoUrl(): string | undefined {
    return this._partnerLogoUrl;
  }

  public get termsAndConditions(): string[] {
    return [...this._termsAndConditions];
  }

  public get validityDays(): number {
    return this._validityDays;
  }

  public get totalQuantity(): number | undefined {
    return this._totalQuantity;
  }

  public get remainingQuantity(): number | undefined {
    return this._remainingQuantity;
  }

  public get status(): RewardStatus {
    return this._status;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business Methods
  public activate(): void {
    this._status = RewardStatus.ACTIVE;
    this._updatedAt = new Date();
  }

  public deactivate(): void {
    this._status = RewardStatus.INACTIVE;
    this._updatedAt = new Date();
  }

  public markOutOfStock(): void {
    this._status = RewardStatus.OUT_OF_STOCK;
    this._updatedAt = new Date();
  }

  public decreaseQuantity(): void {
    if (this._remainingQuantity === undefined) {
      return; // 무제한 수량
    }
    if (this._remainingQuantity <= 0) {
      throw new Error('No remaining quantity');
    }
    this._remainingQuantity--;
    if (this._remainingQuantity === 0) {
      this.markOutOfStock();
    }
    this._updatedAt = new Date();
  }

  public increaseQuantity(amount: number = 1): void {
    if (this._remainingQuantity === undefined) {
      return; // 무제한 수량
    }
    this._remainingQuantity += amount;
    if (this._totalQuantity !== undefined) {
      this._totalQuantity += amount;
    }
    if (this._status === RewardStatus.OUT_OF_STOCK && this._remainingQuantity > 0) {
      this._status = RewardStatus.ACTIVE;
    }
    this._updatedAt = new Date();
  }

  public isAvailable(): boolean {
    return this._status === RewardStatus.ACTIVE && 
           (this._remainingQuantity === undefined || this._remainingQuantity > 0);
  }

  public getDiscountPercentage(): number | null {
    if (!this._originalPrice || this._originalPrice === 0) {
      return null;
    }
    return Math.round((1 - (this._creditCost / this._originalPrice)) * 100);
  }
}

export enum UserRewardStatus {
  PURCHASED = 'PURCHASED',   // 구매됨
  USED = 'USED',            // 사용됨
  EXPIRED = 'EXPIRED',       // 만료됨
  REFUNDED = 'REFUNDED',     // 환불됨
}

export class UserReward {
  private constructor(
    private readonly _id: string,
    private readonly _userId: string,
    private readonly _rewardId: string,
    private readonly _transactionId: string,
    private readonly _purchasedAt: Date,
    private readonly _expiresAt: Date,
    private readonly _couponCode?: string,
    private _status: UserRewardStatus = UserRewardStatus.PURCHASED,
    private _usedAt?: Date,
    private _updatedAt: Date = new Date(),
  ) {}

  public static create(props: {
    userId: string;
    rewardId: string;
    transactionId: string;
    validityDays: number;
    couponCode?: string;
  }): UserReward {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + props.validityDays);

    return new UserReward(
      uuidv4(),
      props.userId,
      props.rewardId,
      props.transactionId,
      new Date(),
      expiresAt,
      props.couponCode,
      UserRewardStatus.PURCHASED,
    );
  }

  public static reconstitute(props: {
    id: string;
    userId: string;
    rewardId: string;
    transactionId: string;
    couponCode?: string;
    status: UserRewardStatus;
    purchasedAt: Date;
    expiresAt: Date;
    usedAt?: Date;
    updatedAt: Date;
  }): UserReward {
    return new UserReward(
      props.id,
      props.userId,
      props.rewardId,
      props.transactionId,
      props.purchasedAt,
      props.expiresAt,
      props.couponCode,
      props.status,
      props.usedAt,
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

  public get rewardId(): string {
    return this._rewardId;
  }

  public get transactionId(): string {
    return this._transactionId;
  }

  public get couponCode(): string | undefined {
    return this._couponCode;
  }

  public get status(): UserRewardStatus {
    return this._status;
  }

  public get purchasedAt(): Date {
    return this._purchasedAt;
  }

  public get expiresAt(): Date {
    return this._expiresAt;
  }

  public get usedAt(): Date | undefined {
    return this._usedAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business Methods
  public use(): void {
    if (this._status !== UserRewardStatus.PURCHASED) {
      throw new Error('Reward must be purchased to use');
    }
    if (this.isExpired()) {
      throw new Error('Reward has expired');
    }
    this._status = UserRewardStatus.USED;
    this._usedAt = new Date();
    this._updatedAt = new Date();
  }

  public refund(): void {
    if (this._status !== UserRewardStatus.PURCHASED) {
      throw new Error('Only purchased rewards can be refunded');
    }
    this._status = UserRewardStatus.REFUNDED;
    this._updatedAt = new Date();
  }

  public markExpired(): void {
    if (this._status === UserRewardStatus.PURCHASED) {
      this._status = UserRewardStatus.EXPIRED;
      this._updatedAt = new Date();
    }
  }

  public isExpired(): boolean {
    return new Date() > this._expiresAt;
  }

  public isUsable(): boolean {
    return this._status === UserRewardStatus.PURCHASED && !this.isExpired();
  }

  public getDaysUntilExpiry(): number {
    const now = new Date();
    const diffTime = this._expiresAt.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
