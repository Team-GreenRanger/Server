import { Injectable, Inject } from '@nestjs/common';
import type { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../../../domain/user/repositories/user.repository.interface';

export interface UpdateUserRequest {
  userId: string;
  name?: string;
  profileImageUrl?: string;
  isActive?: boolean;
  isAdmin?: boolean;
}

export interface UpdateUserResponse {
  user: {
    id: string;
    email: string;
    name: string;
    profileImageUrl?: string;
    isVerified: boolean;
    isActive: boolean;
    isAdmin: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: UpdateUserRequest): Promise<UpdateUserResponse> {
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (request.name !== undefined) {
      user.updateProfile(request.name, request.profileImageUrl);
    }

    if (request.isActive !== undefined) {
      if (request.isActive) {
        user.activate();
      } else {
        user.deactivate();
      }
    }

    if (request.isAdmin !== undefined) {
      user.setAdminRole(request.isAdmin);
    }

    const updatedUser = await this.userRepository.save(user);

    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        profileImageUrl: updatedUser.profileImageUrl,
        isVerified: updatedUser.isVerified,
        isActive: updatedUser.isActive,
        isAdmin: updatedUser.isAdmin,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    };
  }
}