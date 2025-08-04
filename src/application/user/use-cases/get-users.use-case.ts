import { Injectable, Inject } from '@nestjs/common';
import type { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../../../domain/user/repositories/user.repository.interface';

export interface GetUsersRequest {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  isAdmin?: boolean;
}

export interface GetUsersResponse {
  users: Array<{
    id: string;
    email: string;
    name: string;
    profileImageUrl?: string;
    isVerified: boolean;
    isActive: boolean;
    isAdmin: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class GetUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: GetUsersRequest): Promise<GetUsersResponse> {
    const page = request.page || 1;
    const limit = request.limit || 20;
    const offset = (page - 1) * limit;

    const result = await this.userRepository.findUsersWithPagination({
      offset,
      limit,
      search: request.search,
      isActive: request.isActive,
      isAdmin: request.isAdmin,
    });

    const totalPages = Math.ceil(result.total / limit);

    return {
      users: result.users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        profileImageUrl: user.profileImageUrl,
        isVerified: user.isVerified,
        isActive: user.isActive,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      total: result.total,
      page,
      limit,
      totalPages,
    };
  }
}