import { Controller, Post, Body, HttpCode, HttpStatus, ConflictException, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBadRequestResponse, ApiConflictResponse } from '@nestjs/swagger';
import { RegisterUseCase } from '../../../application/auth/use-cases/register.use-case';
import { LoginUseCase } from '../../../application/auth/use-cases/login.use-case';
import { RegisterDto, LoginDto, AuthResponseDto } from '../../../application/auth/dto/auth.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ 
    status: 201, 
    description: 'User successfully registered', 
    type: AuthResponseDto 
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiConflictResponse({ description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    try {
      const result = await this.registerUseCase.execute({
        email: registerDto.email,
        name: registerDto.name,
        password: registerDto.password,
        profileImageUrl: registerDto.profileImageUrl,
        nationality: registerDto.nationality,
        age: registerDto.age,
      });

      return {
        accessToken: result.accessToken,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          profileImageUrl: result.user.profileImageUrl,
          isVerified: result.user.isVerified,
          isActive: result.user.isActive,
          isAdmin: result.user.isAdmin,
          createdAt: result.user.createdAt,
        },
      };
    } catch (error) {
      if (error.message === 'User already exists with this email') {
        throw new ConflictException('User already exists with this email');
      }
      throw error;
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ 
    status: 200, 
    description: 'User successfully logged in', 
    type: AuthResponseDto 
  })
  @ApiBadRequestResponse({ description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    try {
      const result = await this.loginUseCase.execute({
        email: loginDto.email,
        password: loginDto.password,
      });

      return {
        accessToken: result.accessToken,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          profileImageUrl: result.user.profileImageUrl,
          isVerified: result.user.isVerified,
          isActive: result.user.isActive,
          isAdmin: result.user.isAdmin,
          createdAt: result.user.createdAt,
        },
      };
    } catch (error) {
      if (error.message === 'Invalid credentials' || error.message === 'Account is deactivated') {
        throw new UnauthorizedException(error.message);
      }
      throw error;
    }
  }
}
