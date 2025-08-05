import { v4 as uuidv4 } from 'uuid';

export class User {
  private constructor(
    private readonly _id: string,
    private _email: string,
    private _name: string,
    private _hashedPassword: string,
    private _profileImageUrl?: string,
    private _nationality?: string,
    private _age?: number,
    private _totalMissionSolved: number = 0,
    private _isVerified: boolean = false,
    private _isActive: boolean = true,
    private _isAdmin: boolean = false,
    private readonly _createdAt: Date = new Date(),
    private _updatedAt: Date = new Date(),
  ) {}

  public static create(props: {
    email: string;
    name: string;
    hashedPassword: string;
    profileImageUrl?: string;
    nationality?: string;
    age?: number;
    isAdmin?: boolean;
  }): User {
    return new User(
      uuidv4(),
      props.email,
      props.name,
      props.hashedPassword,
      props.profileImageUrl,
      props.nationality,
      props.age,
      0, // totalMissionSolved
      false, // isVerified
      true, // isActive
      props.isAdmin || false, // isAdmin
    );
  }

  public static reconstitute(props: {
    id: string;
    email: string;
    name: string;
    hashedPassword: string;
    profileImageUrl?: string;
    nationality?: string;
    age?: number;
    totalMissionSolved: number;
    isVerified: boolean;
    isActive: boolean;
    isAdmin: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return new User(
      props.id,
      props.email,
      props.name,
      props.hashedPassword,
      props.profileImageUrl,
      props.nationality,
      props.age,
      props.totalMissionSolved,
      props.isVerified,
      props.isActive,
      props.isAdmin,
      props.createdAt,
      props.updatedAt,
    );
  }

  // Getters
  public get id(): string {
    return this._id;
  }

  public get email(): string {
    return this._email;
  }

  public get name(): string {
    return this._name;
  }

  public get hashedPassword(): string {
    return this._hashedPassword;
  }

  public get profileImageUrl(): string | undefined {
    return this._profileImageUrl;
  }

  public get isVerified(): boolean {
    return this._isVerified;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public get isAdmin(): boolean {
    return this._isAdmin;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public get nationality(): string | undefined {
    return this._nationality;
  }

  public get age(): number | undefined {
    return this._age;
  }

  public get totalMissionSolved(): number {
    return this._totalMissionSolved;
  }

  // Business Methods
  public updateProfile(name: string, profileImageUrl?: string, nationality?: string, age?: number): void {
    this._name = name;
    this._profileImageUrl = profileImageUrl;
    this._nationality = nationality;
    this._age = age;
    this._updatedAt = new Date();
  }

  public verify(): void {
    this._isVerified = true;
    this._updatedAt = new Date();
  }

  public deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  public activate(): void {
    this._isActive = true;
    this._updatedAt = new Date();
  }

  public changePassword(newHashedPassword: string): void {
    this._hashedPassword = newHashedPassword;
    this._updatedAt = new Date();
  }

  public setAdminRole(isAdmin: boolean): void {
    this._isAdmin = isAdmin;
    this._updatedAt = new Date();
  }

  public incrementMissionSolved(): void {
    this._totalMissionSolved += 1;
    this._updatedAt = new Date();
  }
}
