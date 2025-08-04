import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './controllers/admin.controller';
import { GetUsersUseCase } from '../../application/user/use-cases/get-users.use-case';
import { UpdateUserUseCase } from '../../application/user/use-cases/update-user.use-case';
import { GetDashboardStatsUseCase } from '../../application/admin/use-cases/get-dashboard-stats.use-case';
import { UserEntity } from '../../infrastructure/database/entities/user.entity';
import { MissionEntity } from '../../infrastructure/database/entities/mission.entity';
import { UserMissionEntity } from '../../infrastructure/database/entities/user-mission.entity';
import { CarbonCreditEntity } from '../../infrastructure/database/entities/carbon-credit.entity';
import { CarbonCreditTransactionEntity } from '../../infrastructure/database/entities/carbon-credit-transaction.entity';
import { TypeOrmUserRepository } from '../../infrastructure/database/repositories/typeorm-user.repository';
import { TypeOrmMissionRepository } from '../../infrastructure/database/repositories/typeorm-mission.repository';
import { TypeOrmUserMissionRepository } from '../../infrastructure/database/repositories/typeorm-user-mission.repository';
import { TypeOrmCarbonCreditRepository } from '../../infrastructure/database/repositories/typeorm-carbon-credit.repository';
import { USER_REPOSITORY } from '../../domain/user/repositories/user.repository.interface';
import { MISSION_REPOSITORY, USER_MISSION_REPOSITORY } from '../../domain/mission/repositories/mission.repository.interface';
import { CARBON_CREDIT_REPOSITORY } from '../../domain/carbon-credit/repositories/carbon-credit.repository.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      MissionEntity,
      UserMissionEntity,
      CarbonCreditEntity,
      CarbonCreditTransactionEntity,
    ])
  ],
  controllers: [AdminController],
  providers: [
    GetUsersUseCase,
    UpdateUserUseCase,
    GetDashboardStatsUseCase,
    {
      provide: USER_REPOSITORY,
      useClass: TypeOrmUserRepository,
    },
    {
      provide: MISSION_REPOSITORY,
      useClass: TypeOrmMissionRepository,
    },
    {
      provide: USER_MISSION_REPOSITORY,
      useClass: TypeOrmUserMissionRepository,
    },
    {
      provide: CARBON_CREDIT_REPOSITORY,
      useClass: TypeOrmCarbonCreditRepository,
    },
  ],
})
export class AdminModule {}