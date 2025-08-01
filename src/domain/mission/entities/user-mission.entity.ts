import { v4 as uuidv4 } from 'uuid';

export enum UserMissionStatus {
  ASSIGNED = 'ASSIGNED',      // 할당됨
  IN_PROGRESS = 'IN_PROGRESS', // 진행중
  SUBMITTED = 'SUBMITTED',     // 제출됨 (검증 대기)
  VERIFIED = 'VERIFIED',       // 검증됨
  REJECTED = 'REJECTED',       // 거부됨
  COMPLETED = 'COMPLETED',     // 완료됨 (보상 지급)
}

export class UserMission {
  private constructor(
    private readonly _id: string,
    private readonly _userId: string,
    private readonly _missionId: string,
    private _status: UserMissionStatus = UserMissionStatus.ASSIGNED,
    private _currentProgress: number = 0,
    private readonly _targetProgress: number = 1,
    private _submissionImageUrls: string[] = [],
    private _submissionNote?: string,
    private _verificationNote?: string,
    private _submittedAt?: Date,
    private _verifiedAt?: Date,
    private _completedAt?: Date,
    private readonly _assignedAt: Date = new Date(),
    private _updatedAt: Date = new Date(),
  ) {}

  public static create(props: {
    userId: string;
    missionId: string;
    targetProgress?: number;
  }): UserMission {
    return new UserMission(
      uuidv4(),
      props.userId,
      props.missionId,
      UserMissionStatus.ASSIGNED,
      0,
      props.targetProgress || 1,
    );
  }

  public static reconstitute(props: {
    id: string;
    userId: string;
    missionId: string;
    status: UserMissionStatus;
    currentProgress: number;
    targetProgress: number;
    submissionImageUrls: string[];
    submissionNote?: string;
    verificationNote?: string;
    submittedAt?: Date;
    verifiedAt?: Date;
    completedAt?: Date;
    assignedAt: Date;
    updatedAt: Date;
  }): UserMission {
    return new UserMission(
      props.id,
      props.userId,
      props.missionId,
      props.status,
      props.currentProgress,
      props.targetProgress,
      props.submissionImageUrls,
      props.submissionNote,
      props.verificationNote,
      props.submittedAt,
      props.verifiedAt,
      props.completedAt,
      props.assignedAt,
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

  public get missionId(): string {
    return this._missionId;
  }

  public get status(): UserMissionStatus {
    return this._status;
  }

  public get currentProgress(): number {
    return this._currentProgress;
  }

  public get targetProgress(): number {
    return this._targetProgress;
  }

  public get submissionImageUrls(): string[] {
    return [...this._submissionImageUrls];
  }

  public get submissionNote(): string | undefined {
    return this._submissionNote;
  }

  public get verificationNote(): string | undefined {
    return this._verificationNote;
  }

  public get submittedAt(): Date | undefined {
    return this._submittedAt;
  }

  public get verifiedAt(): Date | undefined {
    return this._verifiedAt;
  }

  public get completedAt(): Date | undefined {
    return this._completedAt;
  }

  public get assignedAt(): Date {
    return this._assignedAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business Methods
  public startProgress(): void {
    if (this._status !== UserMissionStatus.ASSIGNED) {
      throw new Error('Mission must be assigned to start progress');
    }
    this._status = UserMissionStatus.IN_PROGRESS;
    this._updatedAt = new Date();
  }

  public submitEvidence(imageUrls: string[], note?: string): void {
    if (this._status !== UserMissionStatus.IN_PROGRESS) {
      throw new Error('Mission must be in progress to submit evidence');
    }
    this._submissionImageUrls = imageUrls;
    this._submissionNote = note;
    this._status = UserMissionStatus.SUBMITTED;
    this._submittedAt = new Date();
    this._updatedAt = new Date();
  }

  public verify(verificationNote?: string): void {
    if (this._status !== UserMissionStatus.SUBMITTED) {
      throw new Error('Mission must be submitted to verify');
    }
    this._status = UserMissionStatus.VERIFIED;
    this._verificationNote = verificationNote;
    this._verifiedAt = new Date();
    this._updatedAt = new Date();
  }

  public reject(rejectionNote: string): void {
    if (this._status !== UserMissionStatus.SUBMITTED) {
      throw new Error('Mission must be submitted to reject');
    }
    this._status = UserMissionStatus.REJECTED;
    this._verificationNote = rejectionNote;
    this._updatedAt = new Date();
  }

  public complete(): void {
    if (this._status !== UserMissionStatus.VERIFIED) {
      throw new Error('Mission must be verified to complete');
    }
    this._status = UserMissionStatus.COMPLETED;
    this._currentProgress = this._targetProgress;
    this._completedAt = new Date();
    this._updatedAt = new Date();
  }

  public updateProgress(progress: number): void {
    if (progress < 0 || progress > this._targetProgress) {
      throw new Error('Invalid progress value');
    }
    this._currentProgress = progress;
    this._updatedAt = new Date();
  }

  public getProgressPercentage(): number {
    return (this._currentProgress / this._targetProgress) * 100;
  }

  public isCompleted(): boolean {
    return this._status === UserMissionStatus.COMPLETED;
  }

  public canSubmit(): boolean {
    return this._status === UserMissionStatus.IN_PROGRESS;
  }

  public canVerify(): boolean {
    return this._status === UserMissionStatus.SUBMITTED;
  }
}
