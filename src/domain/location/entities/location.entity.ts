import { v4 as uuidv4 } from 'uuid';

export enum LocationType {
  ZERO_WASTE_SHOP = 'ZERO_WASTE_SHOP',
  ECO_FRIENDLY_RESTAURANT = 'ECO_FRIENDLY_RESTAURANT',
  RECYCLING_CENTER = 'RECYCLING_CENTER',
  ELECTRIC_CHARGING_STATION = 'ELECTRIC_CHARGING_STATION',
  BIKE_SHARING_STATION = 'BIKE_SHARING_STATION',
  PUBLIC_TRANSPORT = 'PUBLIC_TRANSPORT',
  PARK_GREEN_SPACE = 'PARK_GREEN_SPACE',
  FARMERS_MARKET = 'FARMERS_MARKET',
}

export enum LocationStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export class EcoLocation {
  private constructor(
    private readonly _id: string,
    private readonly _name: string,
    private readonly _description: string,
    private readonly _type: LocationType,
    private readonly _address: string,
    private readonly _latitude: number,
    private readonly _longitude: number,
    private readonly _phoneNumber?: string,
    private readonly _websiteUrl?: string,
    private readonly _openingHours?: string,
    private readonly _imageUrls: string[] = [],
    private _rating: number = 0,
    private _reviewCount: number = 0,
    private _status: LocationStatus = LocationStatus.ACTIVE,
    private readonly _createdAt: Date = new Date(),
    private _updatedAt: Date = new Date(),
  ) {}

  public static create(props: {
    name: string;
    description: string;
    type: LocationType;
    address: string;
    latitude: number;
    longitude: number;
    phoneNumber?: string;
    websiteUrl?: string;
    openingHours?: string;
    imageUrls?: string[];
  }): EcoLocation {
    return new EcoLocation(
      uuidv4(),
      props.name,
      props.description,
      props.type,
      props.address,
      props.latitude,
      props.longitude,
      props.phoneNumber,
      props.websiteUrl,
      props.openingHours,
      props.imageUrls || [],
    );
  }

  public static reconstitute(props: {
    id: string;
    name: string;
    description: string;
    type: LocationType;
    address: string;
    latitude: number;
    longitude: number;
    phoneNumber?: string;
    websiteUrl?: string;
    openingHours?: string;
    imageUrls: string[];
    rating: number;
    reviewCount: number;
    status: LocationStatus;
    createdAt: Date;
    updatedAt: Date;
  }): EcoLocation {
    return new EcoLocation(
      props.id,
      props.name,
      props.description,
      props.type,
      props.address,
      props.latitude,
      props.longitude,
      props.phoneNumber,
      props.websiteUrl,
      props.openingHours,
      props.imageUrls,
      props.rating,
      props.reviewCount,
      props.status,
      props.createdAt,
      props.updatedAt,
    );
  }

  public get id(): string {
    return this._id;
  }

  public get name(): string {
    return this._name;
  }

  public get description(): string {
    return this._description;
  }

  public get type(): LocationType {
    return this._type;
  }

  public get address(): string {
    return this._address;
  }

  public get latitude(): number {
    return this._latitude;
  }

  public get longitude(): number {
    return this._longitude;
  }

  public get phoneNumber(): string | undefined {
    return this._phoneNumber;
  }

  public get websiteUrl(): string | undefined {
    return this._websiteUrl;
  }

  public get openingHours(): string | undefined {
    return this._openingHours;
  }

  public get imageUrls(): string[] {
    return [...this._imageUrls];
  }

  public get rating(): number {
    return this._rating;
  }

  public get reviewCount(): number {
    return this._reviewCount;
  }

  public get status(): LocationStatus {
    return this._status;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public activate(): void {
    this._status = LocationStatus.ACTIVE;
    this._updatedAt = new Date();
  }

  public deactivate(): void {
    this._status = LocationStatus.INACTIVE;
    this._updatedAt = new Date();
  }

  public updateRating(newRating: number, newReviewCount: number): void {
    this._rating = newRating;
    this._reviewCount = newReviewCount;
    this._updatedAt = new Date();
  }

  public isActive(): boolean {
    return this._status === LocationStatus.ACTIVE;
  }

  public getDistanceFrom(lat: number, lng: number): number {
    const R = 6371; // km
    const dLat = this.toRad(lat - this._latitude);
    const dLon = this.toRad(lng - this._longitude);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(this._latitude)) * Math.cos(this.toRad(lat)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export class LocationReview {
  private constructor(
    private readonly _id: string,
    private readonly _locationId: string,
    private readonly _userId: string,
    private readonly _userName: string,
    private readonly _userProfileImage?: string,
    private readonly _rating: number = 0,
    private readonly _comment: string = '',
    private readonly _createdAt: Date = new Date(),
  ) {}

  public static create(props: {
    locationId: string;
    userId: string;
    userName: string;
    userProfileImage?: string;
    rating: number;
    comment: string;
  }): LocationReview {
    return new LocationReview(
      uuidv4(),
      props.locationId,
      props.userId,
      props.userName,
      props.userProfileImage,
      props.rating,
      props.comment,
    );
  }

  public static reconstitute(props: {
    id: string;
    locationId: string;
    userId: string;
    userName: string;
    userProfileImage?: string;
    rating: number;
    comment: string;
    createdAt: Date;
  }): LocationReview {
    return new LocationReview(
      props.id,
      props.locationId,
      props.userId,
      props.userName,
      props.userProfileImage,
      props.rating,
      props.comment,
      props.createdAt,
    );
  }

  public get id(): string {
    return this._id;
  }

  public get locationId(): string {
    return this._locationId;
  }

  public get userId(): string {
    return this._userId;
  }

  public get userName(): string {
    return this._userName;
  }

  public get userProfileImage(): string | undefined {
    return this._userProfileImage;
  }

  public get rating(): number {
    return this._rating;
  }

  public get comment(): string {
    return this._comment;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }
}