import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeminiService } from '../../infrastructure/external-apis/gemini/gemini.service';
import { ClaudeService } from '../../infrastructure/external-apis/claude/claude.service';
import { SeoulBikeService } from '../../infrastructure/external-apis/seoul-bike/seoul-bike.service';
import { NotificationService } from '../../application/notification/services/notification.service';
import { FileStorageService } from '../../infrastructure/file-storage/file-storage.service';
import { NotificationEntity } from '../../infrastructure/database/entities/notification.entity';
import { BikeNetworkEntity } from '../../infrastructure/database/entities/bike-network.entity';
import { BikeStationEntity } from '../../infrastructure/database/entities/bike-station.entity';
import { TypeOrmNotificationRepository } from '../../infrastructure/database/repositories/typeorm-notification.repository';
import { NOTIFICATION_REPOSITORY } from '../../domain/notification/repositories/notification.repository.interface';

@Global()
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([NotificationEntity, BikeNetworkEntity, BikeStationEntity]),
  ],
  providers: [
    GeminiService,
    ClaudeService,
    SeoulBikeService,
    NotificationService,
    FileStorageService,
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: TypeOrmNotificationRepository,
    },
  ],
  exports: [
    GeminiService,
    ClaudeService,
    SeoulBikeService,
    NotificationService,
    FileStorageService,
  ],
})
export class SharedServicesModule {}
