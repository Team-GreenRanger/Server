import { v4 as uuidv4 } from 'uuid';

export enum RankingType {
  CARBON_CREDITS = 'CARBON_CREDITS',
  MISSIONS_COMPLETED = 'MISSIONS_COMPLETED',
  CO2_REDUCTION = 'CO2_REDUCTION',
}

export enum RankingPeriod {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  ALL_TIME = 'ALL_TIME',
}

export class RankingEntry {
  private constructor(
    private readonly _rank: number,
    private readonly _userId: string,
    private readonly _userName: string,
    private readonly _profileImageUrl?: string,
    private readonly _score: number = 0,
  ) {}

  public static create(props: {
    rank: number;
    userId: string;
    userName: string;
    profileImageUrl?: string;
    score: number;
    level: number;
  }): RankingEntry {
    return new RankingEntry(
      props.rank,
      props.userId,
      props.userName,
      props.profileImageUrl,
      props.score,
    );
  }

  public get rank(): number {
    return this._rank;
  }

  public get userId(): string {
    return this._userId;
  }

  public get userName(): string {
    return this._userName;
  }

  public get profileImageUrl(): string | undefined {
    return this._profileImageUrl;
  }

  public get score(): number {
    return this._score;
  }
}

export class RankingSnapshot {
  private constructor(
    private readonly _id: string,
    private readonly _type: RankingType,
    private readonly _period: RankingPeriod,
    private readonly _periodIdentifier: string, // '2024-01', '2024' etc.
    private readonly _rankings: RankingEntry[],
    private readonly _totalUsers: number,
    private readonly _snapshotAt: Date = new Date(),
  ) {}

  public static create(props: {
    type: RankingType;
    period: RankingPeriod;
    periodIdentifier: string;
    rankings: RankingEntry[];
    totalUsers: number;
  }): RankingSnapshot {
    return new RankingSnapshot(
      uuidv4(),
      props.type,
      props.period,
      props.periodIdentifier,
      props.rankings,
      props.totalUsers,
    );
  }

  public static reconstitute(props: {
    id: string;
    type: RankingType;
    period: RankingPeriod;
    periodIdentifier: string;
    rankings: RankingEntry[];
    totalUsers: number;
    snapshotAt: Date;
  }): RankingSnapshot {
    return new RankingSnapshot(
      props.id,
      props.type,
      props.period,
      props.periodIdentifier,
      props.rankings,
      props.totalUsers,
      props.snapshotAt,
    );
  }

  public get id(): string {
    return this._id;
  }

  public get type(): RankingType {
    return this._type;
  }

  public get period(): RankingPeriod {
    return this._period;
  }

  public get periodIdentifier(): string {
    return this._periodIdentifier;
  }

  public get rankings(): RankingEntry[] {
    return [...this._rankings];
  }

  public get totalUsers(): number {
    return this._totalUsers;
  }

  public get snapshotAt(): Date {
    return this._snapshotAt;
  }

  public getUserRanking(userId: string): RankingEntry | null {
    return this._rankings.find(entry => entry.userId === userId) || null;
  }

  public getTopRankings(limit: number = 10): RankingEntry[] {
    return this._rankings.slice(0, limit);
  }
}