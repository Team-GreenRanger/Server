import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EcoLocation, LocationType, LocationStatus } from '../../../domain/location/entities/location.entity';
import { ILocationRepository, LocationSearchOptions } from '../../../domain/location/repositories/location.repository.interface';
import { EcoLocationEntity } from '../entities/eco-location.entity';

@Injectable()
export class TypeOrmLocationRepository implements ILocationRepository {
  constructor(
    @InjectRepository(EcoLocationEntity)
    private readonly locationRepository: Repository<EcoLocationEntity>,
  ) {}

  async save(location: EcoLocation): Promise<EcoLocation> {
    const locationEntity = this.toEntity(location);
    const savedEntity = await this.locationRepository.save(locationEntity);
    return this.toDomain(savedEntity);
  }

  async findById(id: string): Promise<EcoLocation | null> {
    const entity = await this.locationRepository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<EcoLocation[]> {
    const entities = await this.locationRepository.find({
      order: { createdAt: 'DESC' }
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async findByType(type: LocationType): Promise<EcoLocation[]> {
    const entities = await this.locationRepository.find({
      where: { type, status: LocationStatus.ACTIVE },
      order: { createdAt: 'DESC' }
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async findByStatus(status: LocationStatus): Promise<EcoLocation[]> {
    const entities = await this.locationRepository.find({
      where: { status },
      order: { createdAt: 'DESC' }
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async searchLocations(options: LocationSearchOptions): Promise<{ locations: EcoLocation[]; total: number }> {
    const queryBuilder = this.locationRepository.createQueryBuilder('location')
      .where('location.status = :status', { status: LocationStatus.ACTIVE });

    if (options.type) {
      queryBuilder.andWhere('location.type = :type', { type: options.type });
    }

    queryBuilder.orderBy('location.createdAt', 'DESC');

    if (options.limit) {
      queryBuilder.limit(options.limit);
    }
    if (options.offset) {
      queryBuilder.offset(options.offset);
    }

    const [entities, total] = await queryBuilder.getManyAndCount();
    const locations = entities.map(entity => this.toDomain(entity));

    return { locations, total };
  }

  async findNearby(latitude: number, longitude: number, radius: number): Promise<EcoLocation[]> {
    const entities = await this.locationRepository.find({
      where: { status: LocationStatus.ACTIVE },
      order: { createdAt: 'DESC' }
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async findNearbyLocations(latitude: number, longitude: number, radius: number, limit?: number): Promise<EcoLocation[]> {
    const queryBuilder = this.locationRepository.createQueryBuilder('location')
      .where('location.status = :status', { status: LocationStatus.ACTIVE })
      .orderBy('location.createdAt', 'DESC');

    if (limit) {
      queryBuilder.limit(limit);
    }

    const entities = await queryBuilder.getMany();
    return entities.map(entity => this.toDomain(entity));
  }

  async getLocationTypeStats(): Promise<Array<{ type: LocationType; count: number; percentage: number }>> {
    const total = await this.locationRepository.count({ where: { status: LocationStatus.ACTIVE } });
    const stats: Array<{ type: LocationType; count: number; percentage: number }> = [];

    for (const type of Object.values(LocationType)) {
      const count = await this.locationRepository.count({
        where: { type, status: LocationStatus.ACTIVE }
      });
      stats.push({
        type,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      });
    }

    return stats;
  }

  async search(params: { type?: LocationType; latitude?: number; longitude?: number; radius?: number; limit?: number; offset?: number }): Promise<{ locations: EcoLocation[]; total: number }> {
    return this.searchLocations(params);
  }

  async update(id: string, updateData: Partial<EcoLocation>): Promise<EcoLocation> {
    const entityUpdate: Partial<EcoLocationEntity> = {};
    
    if (updateData.status) {
      entityUpdate.status = updateData.status;
    }
    
    await this.locationRepository.update(id, entityUpdate);
    const updatedEntity = await this.locationRepository.findOne({ where: { id } });
    if (!updatedEntity) {
      throw new Error('Location not found after update');
    }
    return this.toDomain(updatedEntity);
  }

  async delete(id: string): Promise<void> {
    await this.locationRepository.update(id, { status: LocationStatus.INACTIVE });
  }

  private toEntity(location: EcoLocation): EcoLocationEntity {
    const entity = new EcoLocationEntity();
    entity.id = location.id;
    entity.name = location.name;
    entity.description = location.description;
    entity.type = location.type;
    entity.address = location.address;
    entity.latitude = location.latitude;
    entity.longitude = location.longitude;
    entity.phoneNumber = location.phoneNumber;
    entity.websiteUrl = location.websiteUrl;
    entity.website = location.websiteUrl;
    entity.openingHours = location.openingHours;
    entity.operatingHours = location.openingHours ? { [new Date().getDay().toString()]: location.openingHours } : undefined;
    entity.imageUrls = location.imageUrls;
    entity.imageUrl = location.imageUrls?.[0];
    entity.rating = location.rating;
    entity.reviewCount = location.reviewCount;
    entity.status = location.status;
    entity.createdAt = location.createdAt;
    entity.updatedAt = location.updatedAt;
    return entity;
  }

  private toDomain(entity: EcoLocationEntity): EcoLocation {
    return EcoLocation.reconstitute({
      id: entity.id,
      name: entity.name,
      description: entity.description || '',
      type: entity.type,
      address: entity.address || '',
      latitude: entity.latitude,
      longitude: entity.longitude,
      phoneNumber: entity.phoneNumber,
      websiteUrl: entity.websiteUrl || entity.website,
      openingHours: entity.openingHours || (entity.operatingHours ? JSON.stringify(entity.operatingHours) : undefined),
      imageUrls: entity.imageUrls || (entity.imageUrl ? [entity.imageUrl] : []),
      rating: entity.rating || 0,
      reviewCount: entity.reviewCount || 0,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
