import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MissionController } from './controllers/mission.controller';
import { AssignMissionUseCase } from '../../application/mission/use-cases/assign-mission.use-case';
import { SubmitMissionUseCase } from '../../application/mission/use-cases/submit-mission.use-case';
import { VerifyMissionUseCase } from '../../application/mission/use-cases/verify-mission.use-case';
import { MissionEntity } from '../../infrastructure/database/entities/mission.entity';
import { UserMissionEntity } from '../../infrastructure/database/entities/user-mission.entity';
import { CarbonCreditEntity } from '../../infrastructure/database/entities/carbon-credit.entity';
import { CarbonCreditTransactionEntity } from '../../infrastructure/database/entities/carbon-credit-transaction.entity';
import { TypeOrmMissionRepository } from '../../infrastructure/database/repositories/typeorm-mission.repository';
import { TypeOrmUserMissionRepository } from '../../infrastructure/database/repositories/typeorm-user-mission.repository';
import { TypeOrmCarbonCreditRepository } from '../../infrastructure/database/repositories/typeorm-carbon-credit.repository';
import { 
  MISSION_REPOSITORY, 
  USER_MISSION_REPOSITORY 
} from '../../domain/mission/repositories/mission.repository.interface';
import { CARBON_CREDIT_REPOSITORY } from '../../domain/carbon-credit/repositories/carbon-credit.repository.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MissionEntity,
      UserMissionEntity,
      CarbonCreditEntity,
      CarbonCreditTransactionEntity,
    ])
  ],
  controllers: [MissionController],
  providers: [
    AssignMissionUseCase,
    SubmitMissionUseCase,
    VerifyMissionUseCase,
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
  exports: [
    MISSION_REPOSITORY,
    USER_MISSION_REPOSITORY,
    CARBON_CREDIT_REPOSITORY,
  ],
})
export class MissionModule {}
