import { User } from '../entities/user.entity';

export interface IUserRepository {
  save(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  findUsersWithPagination(params: {
    offset: number;
    limit: number;
    search?: string;
    isActive?: boolean;
    isAdmin?: boolean;
  }): Promise<{
    users: User[];
    total: number;
  }>;
  update(id: string, user: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
  existsByEmail(email: string): Promise<boolean>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
