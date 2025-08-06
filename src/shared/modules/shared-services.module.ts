import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeminiService } from '../../infrastructure/external-apis/gemini/gemini.service';
import { ClaudeService } from '../../infrastructure/external-apis/claude/claude.service';
import { SeoulBikeService } from '../../infrastructure/external-apis/seoul-bike/seoul-bike.service';
import { NotificationService } from '../../application/notification/services/notification.service';
import { FileStorageService } from '../../infrastructure/file-storage/file-storage.service';
import { RoutingService } from '../../application/routing/services/routing.service';
import { NotificationEntity } from '../../infrastructure/database/entities/notification.entity';
import { BikeNetworkEntity } from '../../infrastructure/database/entities/bike-network.entity';
import { BikeStationEntity } from '../../infrastructure/database/entities/bike-station.entity';
import { RoutingSessionEntity } from '../../infrastructure/database/entities/routing-session.entity';
import { CarbonSavingsEntity } from '../../infrastructure/database/entities/carbon-savings.entity';
import { UserEntity } from '../../infrastructure/database/entities/user.entity';
import { CarbonCreditEntity } from '../../infrastructure/database/entities/carbon-credit.entity';
import { TypeOrmNotificationRepository } from '../../infrastructure/database/repositories/typeorm-notification.repository';
import { NOTIFICATION_REPOSITORY } from '../../domain/notification/repositories/notification.repository.interface';
import { TypeOrmUserRepository } from '../../infrastructure/database/repositories/typeorm-user.repository';
import { USER_REPOSITORY } from '../../domain/user/repositories/user.repository.interface';
import { InMemoryEcoTipCacheService } from '../../infrastructure/cache/in-memory-eco-tip-cache.service';
import { GenerateAgeSpecificEcoTipUseCase } from '../../application/eco-tip/use-cases/generate-age-specific-eco-tip.use-case';

@Global()
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      NotificationEntity, 
      BikeNetworkEntity, 
      BikeStationEntity,
      RoutingSessionEntity,
      CarbonSavingsEntity,
      UserEntity,
      CarbonCreditEntity,
    ]),
  ],
  providers: [
    GeminiService,
    ClaudeService,
    SeoulBikeService,
    NotificationService,
    FileStorageService,
    RoutingService,
    InMemoryEcoTipCacheService,
    GenerateAgeSpecificEcoTipUseCase,
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: TypeOrmNotificationRepository,
    },
    {
      provide: USER_REPOSITORY,
      useClass: TypeOrmUserRepository,
    },
  ],
  exports: [
    GeminiService,
    ClaudeService,
    SeoulBikeService,
    NotificationService,
    FileStorageService,
    RoutingService,
    InMemoryEcoTipCacheService,
    GenerateAgeSpecificEcoTipUseCase,
  ],
})
export class SharedServicesModule {}
