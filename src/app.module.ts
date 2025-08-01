import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MulterModule } from '@nestjs/platform-express';
import { createDataSource } from './infrastructure/database/data-source';
import { ConfigService } from '@nestjs/config';

// Database Entities
import { CarbonCreditEntity } from './infrastructure/database/entities/carbon-credit.entity';
import { CarbonCreditTransactionEntity } from './infrastructure/database/entities/carbon-credit-transaction.entity';

// Infrastructure Services (moved to SharedServicesModule)
// Repository implementations
import { TypeOrmCarbonCreditRepository } from './infrastructure/database/repositories/typeorm-carbon-credit.repository';
import { CARBON_CREDIT_REPOSITORY } from './domain/carbon-credit/repositories/carbon-credit.repository.interface';

// Application Use Cases
import { ChatWithAIUseCase } from './application/ai-assistant/use-cases/chat-with-ai.use-case';
import { VerifyImageWithAIUseCase } from './application/ai-assistant/use-cases/verify-image-with-ai.use-case';
import { GetCarbonCreditBalanceUseCase } from './application/carbon-credit/use-cases/get-carbon-credit-balance.use-case';
import { GetTransactionHistoryUseCase } from './application/carbon-credit/use-cases/get-transaction-history.use-case';

// Presentation Controllers
import { AIAssistantController } from './presentation/ai-assistant/controllers/ai-assistant.controller';
import { CarbonCreditController } from './presentation/carbon-credit/controllers/carbon-credit.controller';
import { UploadController } from './presentation/upload/upload.controller';
import { UserController } from './presentation/user/controllers/user.controller';
import { NotificationController } from './presentation/notification/controllers/notification.controller';
import { RankingController } from './presentation/ranking/controllers/ranking.controller';
import { RewardController } from './presentation/reward/controllers/reward.controller';
import { LocationController } from './presentation/location/controllers/location.controller';

// Modules
import { AuthModule } from './presentation/auth/auth.module';
import { UserModule } from './presentation/user/user.module';
import { MissionModule } from './presentation/mission/mission.module';
import { SharedServicesModule } from './shared/modules/shared-services.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => createDataSource(configService).options,
    }),

    // TypeORM entities for controllers outside modules
    TypeOrmModule.forFeature([
      CarbonCreditEntity,
      CarbonCreditTransactionEntity,
    ]),

    // JWT
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'your-secret-key'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '7d'),
        },
      }),
    }),

    // Passport
    PassportModule,

    // Multer for file uploads
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dest: configService.get('UPLOAD_PATH', './uploads'),
        limits: {
          fileSize: 5 * 1024 * 1024, // 5MB
        },
      }),
    }),

    // Feature Modules
    SharedServicesModule,
    AuthModule,
    UserModule,
    MissionModule,
  ],
  controllers: [
    AIAssistantController,
    CarbonCreditController,
    UploadController,
    UserController,
    NotificationController,
    RankingController,
    RewardController,
    LocationController,
  ],
  providers: [
    // Repository implementations
    {
      provide: CARBON_CREDIT_REPOSITORY,
      useClass: TypeOrmCarbonCreditRepository,
    },
    
    // Use Cases
    ChatWithAIUseCase,
    VerifyImageWithAIUseCase,
    GetCarbonCreditBalanceUseCase,
    GetTransactionHistoryUseCase,
  ],
})
export class AppModule {}
