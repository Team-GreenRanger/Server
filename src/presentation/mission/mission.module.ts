import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MissionController } from './controllers/mission.controller';
import { AssignMissionUseCase } from '../../application/mission/use-cases/assign-mission.use-case';
import { SubmitMissionUseCase } from '../../application/mission/use-cases/submit-mission.use-case';
import { VerifyMissionUseCase } from '../../application/mission/use-cases/verify-mission.use-case';
import { GetMissionsUseCase } from '../../application/mission/use-cases/get-missions.use-case';
import { GetMissionByIdUseCase } from '../../application/mission/use-cases/get-mission-by-id.use-case';
import { GetUserMissionsUseCase } from '../../application/mission/use-cases/get-user-missions.use-case';
import { GetDailyMissionsUseCase } from '../../application/mission/use-cases/get-daily-missions.use-case';
import { CreateMissionUseCase } from '../../application/mission/use-cases/create-mission.use-case';
import { GetPendingVerificationsUseCase } from '../../application/mission/use-cases/get-pending-verifications.use-case';
import { MissionEntity } from '../../infrastructure/database/entities/mission.entity';
import { UserMissionEntity } from '../../infrastructure/database/entities/user-mission.entity';
import { UserEntity } from '../../infrastructure/database/entities/user.entity';
import { CarbonCreditEntity } from '../../infrastructure/database/entities/carbon-credit.entity';
import { CarbonCreditTransactionEntity } from '../../infrastructure/database/entities/carbon-credit-transaction.entity';
import { TypeOrmMissionRepository } from '../../infrastructure/database/repositories/typeorm-mission.repository';
import { TypeOrmUserMissionRepository } from '../../infrastructure/database/repositories/typeorm-user-mission.repository';
import { TypeOrmUserRepository } from '../../infrastructure/database/repositories/typeorm-user.repository';
import { TypeOrmCarbonCreditRepository } from '../../infrastructure/database/repositories/typeorm-carbon-credit.repository';
import { 
  MISSION_REPOSITORY, 
  USER_MISSION_REPOSITORY 
} from '../../domain/mission/repositories/mission.repository.interface';
import { USER_REPOSITORY } from '../../domain/user/repositories/user.repository.interface';
import { CARBON_CREDIT_REPOSITORY } from '../../domain/carbon-credit/repositories/carbon-credit.repository.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MissionEntity,
      UserMissionEntity,
      UserEntity,
      CarbonCreditEntity,
      CarbonCreditTransactionEntity,
    ])
  ],
  controllers: [MissionController],
  providers: [
    AssignMissionUseCase,
    SubmitMissionUseCase,
    VerifyMissionUseCase,
    GetMissionsUseCase,
    GetMissionByIdUseCase,
    GetUserMissionsUseCase,
    GetDailyMissionsUseCase,
    CreateMissionUseCase,
    GetPendingVerificationsUseCase,
    {
      provide: MISSION_REPOSITORY,
      useClass: TypeOrmMissionRepository,
    },
    {
      provide: USER_MISSION_REPOSITORY,
      useClass: TypeOrmUserMissionRepository,
    },
    {
      provide: USER_REPOSITORY,
      useClass: TypeOrmUserRepository,
    },
    {
      provide: CARBON_CREDIT_REPOSITORY,
      useClass: TypeOrmCarbonCreditRepository,
    },
  ],
  exports: [
    MISSION_REPOSITORY,
    USER_MISSION_REPOSITORY,
    USER_REPOSITORY,
    CARBON_CREDIT_REPOSITORY,
  ],
})
export class MissionModule {}
