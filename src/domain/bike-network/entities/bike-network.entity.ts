import { v4 as uuidv4 } from 'uuid';

export class BikeNetwork {
  private constructor(
    private readonly _id: string,
    private readonly _externalId: string,
    private readonly _name: string,
    private readonly _latitude: number,
    private readonly _longitude: number,
    private readonly _city: string,
    private readonly _country: string,
    private readonly _companies: string[],
    private readonly _gbfsHref?: string,
    private readonly _system?: string,
    private readonly _source?: string,
    private readonly _ebikes?: boolean,
    private readonly _createdAt: Date = new Date(),
    private _updatedAt: Date = new Date(),
  ) {}

  public static create(props: {
    externalId: string;
    name: string;
    latitude: number;
    longitude: number;
    city: string;
    country: string;
    companies: string[];
    gbfsHref?: string;
    system?: string;
    source?: string;
    ebikes?: boolean;
  }): BikeNetwork {
    return new BikeNetwork(
      uuidv4(),
      props.externalId,
      props.name,
      props.latitude,
      props.longitude,
      props.city,
      props.country,
      props.companies,
      props.gbfsHref,
      props.system,
      props.source,
      props.ebikes,
    );
  }

  public static reconstitute(props: {
    id: string;
    externalId: string;
    name: string;
    latitude: number;
    longitude: number;
    city: string;
    country: string;
    companies: string[];
    gbfsHref?: string;
    system?: string;
    source?: string;
    ebikes?: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): BikeNetwork {
    return new BikeNetwork(
      props.id,
      props.externalId,
      props.name,
      props.latitude,
      props.longitude,
      props.city,
      props.country,
      props.companies,
      props.gbfsHref,
      props.system,
      props.source,
      props.ebikes,
      props.createdAt,
      props.updatedAt,
    );
  }

  // Getters
  public get id(): string {
    return this._id;
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

  public get city(): string {
    return this._city;
  }

  public get country(): string {
    return this._country;
  }

  public get companies(): string[] {
    return [...this._companies];
  }

  public get gbfsHref(): string | undefined {
    return this._gbfsHref;
  }

  public get system(): string | undefined {
    return this._system;
  }

  public get source(): string | undefined {
    return this._source;
  }

  public get ebikes(): boolean | undefined {
    return this._ebikes;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business Methods
  public updateTimestamp(): void {
    this._updatedAt = new Date();
  }
}
