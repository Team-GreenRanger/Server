import { v4 as uuidv4 } from 'uuid';

export enum MissionType {
  ENERGY_SAVING = 'ENERGY_SAVING',        // 에너지 절약
  TRANSPORTATION = 'TRANSPORTATION',       // 교통
  WASTE_REDUCTION = 'WASTE_REDUCTION',     // 폐기물 감소
  RECYCLING = 'RECYCLING',                 // 재활용
  WATER_CONSERVATION = 'WATER_CONSERVATION', // 물 절약
  SUSTAINABLE_CONSUMPTION = 'SUSTAINABLE_CONSUMPTION', // 지속가능한 소비
}

export enum MissionStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  INACTIVE = 'INACTIVE',
}

export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export class Mission {
  private constructor(
    private readonly _id: string,
    private readonly _title: string,
    private readonly _description: string,
    private readonly _type: MissionType,
    private readonly _difficulty: DifficultyLevel,
    private readonly _co2ReductionAmount: number, // kg CO2 reduced
    private readonly _creditReward: number,
    private readonly _imageUrl?: string,
    private readonly _instructions: string[] = [],
    private readonly _verificationCriteria: string[] = [],
    private _status: MissionStatus = MissionStatus.ACTIVE,
    private readonly _createdAt: Date = new Date(),
    private _updatedAt: Date = new Date(),
  ) {}

  public static create(props: {
    title: string;
    description: string;
    type: MissionType;
    difficulty: DifficultyLevel;
    co2ReductionAmount: number;
    creditReward: number;
    imageUrl?: string;
    instructions?: string[];
    verificationCriteria?: string[];
  }): Mission {
    return new Mission(
      uuidv4(),
      props.title,
      props.description,
      props.type,
      props.difficulty,
      props.co2ReductionAmount,
      props.creditReward,
      props.imageUrl,
      props.instructions || [],
      props.verificationCriteria || [],
    );
  }

  public static reconstitute(props: {
    id: string;
    title: string;
    description: string;
    type: MissionType;
    difficulty: DifficultyLevel;
    co2ReductionAmount: number;
    creditReward: number;
    imageUrl?: string;
    instructions: string[];
    verificationCriteria: string[];
    status: MissionStatus;
    createdAt: Date;
    updatedAt: Date;
  }): Mission {
    return new Mission(
      props.id,
      props.title,
      props.description,
      props.type,
      props.difficulty,
      props.co2ReductionAmount,
      props.creditReward,
      props.imageUrl,
      props.instructions,
      props.verificationCriteria,
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

  public get type(): MissionType {
    return this._type;
  }

  public get difficulty(): DifficultyLevel {
    return this._difficulty;
  }

  public get co2ReductionAmount(): number {
    return this._co2ReductionAmount;
  }

  public get creditReward(): number {
    return this._creditReward;
  }

  public get imageUrl(): string | undefined {
    return this._imageUrl;
  }

  public get instructions(): string[] {
    return [...this._instructions];
  }

  public get verificationCriteria(): string[] {
    return [...this._verificationCriteria];
  }

  public get status(): MissionStatus {
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
    this._status = MissionStatus.ACTIVE;
    this._updatedAt = new Date();
  }

  public deactivate(): void {
    this._status = MissionStatus.INACTIVE;
    this._updatedAt = new Date();
  }

  public complete(): void {
    this._status = MissionStatus.COMPLETED;
    this._updatedAt = new Date();
  }

  public isActive(): boolean {
    return this._status === MissionStatus.ACTIVE;
  }

  public isCompleted(): boolean {
    return this._status === MissionStatus.COMPLETED;
  }
}
