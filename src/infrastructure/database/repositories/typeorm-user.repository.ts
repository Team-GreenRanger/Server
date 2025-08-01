import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../domain/user/entities/user.entity';
import { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async save(user: User): Promise<User> {
    const userEntity = this.toEntity(user);
    const savedEntity = await this.userRepository.save(userEntity);
    return this.toDomain(savedEntity);
  }

  async findById(id: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({ where: { id } });
    return userEntity ? this.toDomain(userEntity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({ where: { email } });
    return userEntity ? this.toDomain(userEntity) : null;
  }

  async findAll(): Promise<User[]> {
    const userEntities = await this.userRepository.find();
    return userEntities.map(entity => this.toDomain(entity));
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    await this.userRepository.update(id, userData as any);
    const updatedEntity = await this.userRepository.findOne({ where: { id } });
    if (!updatedEntity) {
      throw new Error('User not found after update');
    }
    return this.toDomain(updatedEntity);
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.userRepository.count({ where: { id } });
    return count > 0;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.userRepository.count({ where: { email } });
    return count > 0;
  }

  private toEntity(user: User): UserEntity {
    const entity = new UserEntity();
    entity.id = user.id;
    entity.email = user.email;
    entity.name = user.name;
    entity.hashedPassword = user.hashedPassword;
    entity.profileImageUrl = user.profileImageUrl;
    entity.isVerified = user.isVerified;
    entity.isActive = user.isActive;
    entity.createdAt = user.createdAt;
    entity.updatedAt = user.updatedAt;
    return entity;
  }

  private toDomain(entity: UserEntity): User {
    return User.reconstitute({
      id: entity.id,
      email: entity.email,
      name: entity.name,
      hashedPassword: entity.hashedPassword,
      profileImageUrl: entity.profileImageUrl,
      isVerified: entity.isVerified,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
