import { v4 as uuidv4 } from 'uuid';

export class BikeStation {
  private constructor(
    private readonly _id: string,
    private readonly _networkId: string,
    private readonly _externalId: string,
    private readonly _name: string,
    private readonly _latitude: number,
    private readonly _longitude: number,
    private _freeBikes: number,
    private _emptySlots: number,
    private readonly _totalSlots: number,
    private readonly _address?: string,
    private readonly _postCode?: string,
    private readonly _paymentMethods: string[] = [],
    private readonly _hasPaymentTerminal: boolean = false,
    private readonly _altitude: number = 0,
    private readonly _androidUri?: string,
    private readonly _iosUri?: string,
    private readonly _isVirtual: boolean = false,
    private readonly _isRenting: boolean = true,
    private readonly _isReturning: boolean = true,
    private _lastUpdated: Date = new Date(),
    private readonly _createdAt: Date = new Date(),
    private _updatedAt: Date = new Date(),
  ) {}

  public static create(props: {
    networkId: string;
    externalId: string;
    name: string;
    latitude: number;
    longitude: number;
    freeBikes: number;
    emptySlots: number;
    totalSlots: number;
    address?: string;
    postCode?: string;
    paymentMethods?: string[];
    hasPaymentTerminal?: boolean;
    altitude?: number;
    androidUri?: string;
    iosUri?: string;
    isVirtual?: boolean;
    isRenting?: boolean;
    isReturning?: boolean;
  }): BikeStation {
    return new BikeStation(
      uuidv4(),
      props.networkId,
      props.externalId,
      props.name,
      props.latitude,
      props.longitude,
      props.freeBikes,
      props.emptySlots,
      props.totalSlots,
      props.address,
      props.postCode,
      props.paymentMethods || [],
      props.hasPaymentTerminal || false,
      props.altitude || 0,
      props.androidUri,
      props.iosUri,
      props.isVirtual || false,
      props.isRenting !== undefined ? props.isRenting : true,
      props.isReturning !== undefined ? props.isReturning : true,
    );
  }

  public static reconstitute(props: {
    id: string;
    networkId: string;
    externalId: string;
    name: string;
    latitude: number;
    longitude: number;
    freeBikes: number;
    emptySlots: number;
    totalSlots: number;
    address?: string;
    postCode?: string;
    paymentMethods: string[];
    hasPaymentTerminal: boolean;
    altitude: number;
    androidUri?: string;
    iosUri?: string;
    isVirtual: boolean;
    isRenting: boolean;
    isReturning: boolean;
    lastUpdated: Date;
    createdAt: Date;
    updatedAt: Date;
  }): BikeStation {
    return new BikeStation(
      props.id,
      props.networkId,
      props.externalId,
      props.name,
      props.latitude,
      props.longitude,
      props.freeBikes,
      props.emptySlots,
      props.totalSlots,
      props.address,
      props.postCode,
      props.paymentMethods,
      props.hasPaymentTerminal,
      props.altitude,
      props.androidUri,
      props.iosUri,
      props.isVirtual,
      props.isRenting,
      props.isReturning,
      props.lastUpdated,
      props.createdAt,
      props.updatedAt,
    );
  }

  // Getters
  public get id(): string {
    return this._id;
  }

  public get networkId(): string {
    return this._networkId;
  }

  public get externalId(): string {
    return this._externalId;
  }

  public get name(): string {
    return this._name;
  }

  public get latitude(): number {
    return this._latitude;
  }

  public get longitude(): number {
    return this._longitude;
  }

  public get freeBikes(): number {
    return this._freeBikes;
  }

  public get emptySlots(): number {
    return this._emptySlots;
  }

  public get totalSlots(): number {
    return this._totalSlots;
  }

  public get address(): string | undefined {
    return this._address;
  }

  public get postCode(): string | undefined {
    return this._postCode;
  }

  public get paymentMethods(): string[] {
    return [...this._paymentMethods];
  }

  public get hasPaymentTerminal(): boolean {
    return this._hasPaymentTerminal;
  }

  public get altitude(): number {
    return this._altitude;
  }

  public get androidUri(): string | undefined {
    return this._androidUri;
  }

  public get iosUri(): string | undefined {
    return this._iosUri;
  }

  public get isVirtual(): boolean {
    return this._isVirtual;
  }

  public get isRenting(): boolean {
    return this._isRenting;
  }

  public get isReturning(): boolean {
    return this._isReturning;
  }

  public get lastUpdated(): Date {
    return this._lastUpdated;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business Methods
  public updateAvailability(freeBikes: number, emptySlots: number): void {
    this._freeBikes = freeBikes;
    this._emptySlots = emptySlots;
    this._lastUpdated = new Date();
    this._updatedAt = new Date();
  }

  public isAvailable(): boolean {
    return this._freeBikes > 0;
  }

  public hasEmptySlots(): boolean {
    return this._emptySlots > 0;
  }

  public getOccupancyRate(): number {
    const occupiedSlots = this._totalSlots - this._emptySlots;
    return this._totalSlots > 0 ? (occupiedSlots / this._totalSlots) * 100 : 0;
  }
}
