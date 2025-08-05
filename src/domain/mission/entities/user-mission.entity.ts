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
  }): UserMission {
    return new UserMission(
      uuidv4(),
      props.userId,
      props.missionId,
      UserMissionStatus.ASSIGNED,
      0,
    );
  }

  public static reconstitute(props: {
    id: string;
    userId: string;
    missionId: string;
    status: UserMissionStatus;
    currentProgress: number;
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
    // ASSIGNED, IN_PROGRESS, REJECTED 상태에서 제출 가능
    if (!this.canSubmit()) {
      throw new Error('Mission cannot be submitted in current state');
    }
    
    // ASSIGNED 상태라면 자동으로 IN_PROGRESS로 변경
    if (this._status === UserMissionStatus.ASSIGNED) {
      this._status = UserMissionStatus.IN_PROGRESS;
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
    this._completedAt = new Date();
    this._updatedAt = new Date();
  }

  public updateProgress(progress: number, requiredSubmissions: number): void {
    if (progress < 0 || progress > requiredSubmissions) {
      throw new Error('Invalid progress value');
    }
    this._currentProgress = progress;
    this._updatedAt = new Date();
  }

  public getProgressPercentage(requiredSubmissions: number): number {
    return (this._currentProgress / requiredSubmissions) * 100;
  }

  public isCompleted(): boolean {
    return this._status === UserMissionStatus.COMPLETED;
  }

  public canSubmit(): boolean {
    return this._status === UserMissionStatus.ASSIGNED || 
           this._status === UserMissionStatus.IN_PROGRESS || 
           this._status === UserMissionStatus.REJECTED;
  }

  public canVerify(): boolean {
    return this._status === UserMissionStatus.SUBMITTED;
  }

  public isFullyCompleted(requiredSubmissions: number): boolean {
    return this._currentProgress >= requiredSubmissions;
  }

  public incrementProgress(requiredSubmissions: number): void {
    if (this._currentProgress < requiredSubmissions) {
      this._currentProgress++;
      this._updatedAt = new Date();
    }
  }

  public needsMoreSubmissions(requiredSubmissions: number): boolean {
    return this._currentProgress < requiredSubmissions;
  }

  public getRemainingSubmissions(requiredSubmissions: number): number {
    return Math.max(0, requiredSubmissions - this._currentProgress);
  }

  public continueProgress(): void {
    // 검증 후 더 제출이 필요한 경우 IN_PROGRESS 상태로 돌아감
    this._status = UserMissionStatus.IN_PROGRESS;
    this._updatedAt = new Date();
  }
}
