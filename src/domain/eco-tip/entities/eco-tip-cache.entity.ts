import { v4 as uuidv4 } from 'uuid';

export class EcoTipCache {
  private constructor(
    private readonly _id: string,
    private readonly _userAge: number,
    private readonly _tipDate: Date,
    private readonly _tipContent: string,
    private readonly _category: string,
    private readonly _createdAt: Date = new Date(),
  ) {}

  public static create(props: {
    userAge: number;
    tipDate: Date;
    tipContent: string;
    category?: string;
  }): EcoTipCache {
    return new EcoTipCache(
      uuidv4(),
      props.userAge,
      props.tipDate,
      props.tipContent,
      props.category || 'daily_tip',
    );
  }

  public static reconstitute(props: {
    id: string;
    userAge: number;
    tipDate: Date;
    tipContent: string;
    category: string;
    createdAt: Date;
  }): EcoTipCache {
    return new EcoTipCache(
      props.id,
      props.userAge,
      props.tipDate,
      props.tipContent,
      props.category,
      props.createdAt,
    );
  }

  public get id(): string {
    return this._id;
  }

  public get userAge(): number {
    return this._userAge;
  }

  public get tipDate(): Date {
    return this._tipDate;
  }

  public get tipContent(): string {
    return this._tipContent;
  }

  public get category(): string {
    return this._category;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public isValidForDate(date: Date): boolean {
    return this._tipDate.toDateString() === date.toDateString();
  }

  public isValidForAge(age: number): boolean {
    return this._userAge === age;
  }
}
