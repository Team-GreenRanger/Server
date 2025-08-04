import { v4 as uuidv4 } from 'uuid';

export class User {
  private constructor(
    private readonly _id: string,
    private _email: string,
    private _name: string,
    private _hashedPassword: string,
    private _profileImageUrl?: string,
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
    isAdmin?: boolean;
  }): User {
    return new User(
      uuidv4(),
      props.email,
      props.name,
      props.hashedPassword,
      props.profileImageUrl,
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

  // Business Methods
  public updateProfile(name: string, profileImageUrl?: string): void {
    this._name = name;
    this._profileImageUrl = profileImageUrl;
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
}
