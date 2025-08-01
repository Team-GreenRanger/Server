import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './controllers/auth.controller';
import { RegisterUseCase } from '../../application/auth/use-cases/register.use-case';
import { LoginUseCase } from '../../application/auth/use-cases/login.use-case';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserEntity } from '../../infrastructure/database/entities/user.entity';
import { TypeOrmUserRepository } from '../../infrastructure/database/repositories/typeorm-user.repository';
import { USER_REPOSITORY } from '../../domain/user/repositories/user.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [AuthController],
  providers: [
    RegisterUseCase,
    LoginUseCase,
    JwtStrategy,
    {
      provide: USER_REPOSITORY,
      useClass: TypeOrmUserRepository,
    },
  ],
  exports: [USER_REPOSITORY],
})
export class AuthModule {}
