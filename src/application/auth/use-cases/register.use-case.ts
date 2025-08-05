import { Injectable, Inject } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../../domain/user/entities/user.entity';
import type { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../../../domain/user/repositories/user.repository.interface';

export interface RegisterCommand {
  email: string;
  name: string;
  password: string;
  profileImageUrl?: string;
  nationality?: string;
  age?: number;
}

export interface RegisterResult {
  user: User;
  accessToken: string;
}

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(command: RegisterCommand): Promise<RegisterResult> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(command.email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(command.password, 12);

    // Create user domain entity
    const user = User.create({
      email: command.email,
      name: command.name,
      hashedPassword,
      profileImageUrl: command.profileImageUrl,
      nationality: command.nationality,
      age: command.age,
    });

    // Save user
    const savedUser = await this.userRepository.save(user);

    // Generate JWT token
    const payload = { sub: savedUser.id, email: savedUser.email, isAdmin: savedUser.isAdmin };
    const accessToken = this.jwtService.sign(payload);

    return {
      user: savedUser,
      accessToken,
    };
  }
}
