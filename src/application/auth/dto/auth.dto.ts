import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe', description: 'User full name' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'password123', description: 'User password', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', description: 'Profile image URL' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  profileImageUrl?: string;

  @ApiPropertyOptional({ example: 'South Korea', description: 'User nationality' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nationality?: string;

  @ApiPropertyOptional({ example: 25, description: 'User age' })
  @IsOptional()
  @IsNumber()
  @Min(13)
  @Max(120)
  age?: number;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @IsString()
  @MinLength(1)
  password: string;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ description: 'User information' })
  user: {
    id: string;
    email: string;
    name: string;
    profileImageUrl?: string;
    isVerified: boolean;
    isActive: boolean;
    isAdmin: boolean;
    createdAt: Date;
  };
}
