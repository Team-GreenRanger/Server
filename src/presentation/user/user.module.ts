import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../infrastructure/database/entities/user.entity';
import { TypeOrmUserRepository } from '../../infrastructure/database/repositories/typeorm-user.repository';
import { USER_REPOSITORY } from '../../domain/user/repositories/user.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: TypeOrmUserRepository,
    },
  ],
  exports: [USER_REPOSITORY],
})
export class UserModule {}
