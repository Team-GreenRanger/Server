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
import { RewardEntity } from './infrastructure/database/entities/reward.entity';
import { UserRewardEntity } from './infrastructure/database/entities/user-reward.entity';
import { UserEntity } from './infrastructure/database/entities/user.entity';
import { EcoLocationEntity } from './infrastructure/database/entities/eco-location.entity';
import { LocationReviewEntity } from './infrastructure/database/entities/location-review.entity';

// Infrastructure Services (moved to SharedServicesModule)
// Repository implementations
import { TypeOrmCarbonCreditRepository } from './infrastructure/database/repositories/typeorm-carbon-credit.repository';
import { TypeOrmRewardRepository, TypeOrmUserRewardRepository } from './infrastructure/database/repositories/typeorm-reward.repository';
import { TypeOrmUserRepository } from './infrastructure/database/repositories/typeorm-user.repository';
import { TypeOrmLocationReviewRepository } from './infrastructure/database/repositories/typeorm-location-review.repository';
import { TypeOrmLocationRepository } from './infrastructure/database/repositories/typeorm-location.repository';
import { TypeOrmRankingRepository } from './infrastructure/database/repositories/typeorm-ranking.repository';
import { CARBON_CREDIT_REPOSITORY } from './domain/carbon-credit/repositories/carbon-credit.repository.interface';
import { REWARD_REPOSITORY, USER_REWARD_REPOSITORY } from './domain/reward/repositories/reward.repository.interface';
import { USER_REPOSITORY } from './domain/user/repositories/user.repository.interface';
import { LOCATION_REPOSITORY, LOCATION_REVIEW_REPOSITORY } from './domain/location/repositories/location.repository.interface';
import { RANKING_REPOSITORY } from './domain/ranking/repositories/ranking.repository.interface';

// Application Use Cases
import { ChatWithAIUseCase } from './application/ai-assistant/use-cases/chat-with-ai.use-case';
import { VerifyImageWithAIUseCase } from './application/ai-assistant/use-cases/verify-image-with-ai.use-case';
import { GetConversationsUseCase } from './application/ai-assistant/use-cases/get-conversations.use-case';
import { GetCarbonCreditBalanceUseCase } from './application/carbon-credit/use-cases/get-carbon-credit-balance.use-case';
import { GetTransactionHistoryUseCase } from './application/carbon-credit/use-cases/get-transaction-history.use-case';
import { GetCarbonCreditStatisticsUseCase } from './application/carbon-credit/use-cases/get-carbon-credit-statistics.use-case';
import { GetCurrentRankingsUseCase } from './application/ranking/use-cases/get-current-rankings.use-case';
import { GetCurrentUserRankingUseCase } from './application/ranking/use-cases/get-current-user-ranking.use-case';
import { GetRewardsUseCase } from './application/reward/use-cases/get-rewards.use-case';
import { GetRewardByIdUseCase } from './application/reward/use-cases/get-reward-by-id.use-case';
import { RedeemRewardUseCase } from './application/reward/use-cases/redeem-reward.use-case';
import { GetUserRewardsUseCase } from './application/reward/use-cases/get-user-rewards.use-case';
import { GetUserRewardByIdUseCase } from './application/reward/use-cases/get-user-reward-by-id.use-case';
import { CreateRewardUseCase } from './application/reward/use-cases/create-reward.use-case';
import { UpdateRewardUseCase } from './application/reward/use-cases/update-reward.use-case';
import { DeleteRewardUseCase } from './application/reward/use-cases/delete-reward.use-case';
import { SearchLocationsUseCase } from './application/location/use-cases/search-locations.use-case';
import { GetNearbyLocationsUseCase } from './application/location/use-cases/get-nearby-locations.use-case';
import { GetLocationByIdUseCase } from './application/location/use-cases/get-location-by-id.use-case';
import { GetLocationReviewsUseCase } from './application/location/use-cases/get-location-reviews.use-case';
import { CreateLocationReviewUseCase } from './application/location/use-cases/create-location-review.use-case';
import { GetLocationTypeStatsUseCase } from './application/location/use-cases/get-location-type-stats.use-case';

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
      UserEntity,
      CarbonCreditEntity,
      CarbonCreditTransactionEntity,
      RewardEntity,
      UserRewardEntity,
      EcoLocationEntity,
      LocationReviewEntity,
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
      provide: USER_REPOSITORY,
      useClass: TypeOrmUserRepository,
    },
    {
      provide: CARBON_CREDIT_REPOSITORY,
      useClass: TypeOrmCarbonCreditRepository,
    },
    {
      provide: REWARD_REPOSITORY,
      useClass: TypeOrmRewardRepository,
    },
    {
      provide: USER_REWARD_REPOSITORY,
      useClass: TypeOrmUserRewardRepository,
    },
    {
      provide: LOCATION_REPOSITORY,
      useClass: TypeOrmLocationRepository,
    },
    {
      provide: LOCATION_REVIEW_REPOSITORY,
      useClass: TypeOrmLocationReviewRepository,
    },
    {
      provide: RANKING_REPOSITORY,
      useClass: TypeOrmRankingRepository,
    },
    
    // Use Cases
    ChatWithAIUseCase,
    VerifyImageWithAIUseCase,
    GetConversationsUseCase,
    GetCarbonCreditBalanceUseCase,
    GetTransactionHistoryUseCase,
    GetCarbonCreditStatisticsUseCase,
    GetCurrentRankingsUseCase,
    GetCurrentUserRankingUseCase,
    GetRewardsUseCase,
    GetRewardByIdUseCase,
    RedeemRewardUseCase,
    GetUserRewardsUseCase,
    GetUserRewardByIdUseCase,
    CreateRewardUseCase,
    UpdateRewardUseCase,
    DeleteRewardUseCase,
    SearchLocationsUseCase,
    GetNearbyLocationsUseCase,
    GetLocationByIdUseCase,
    GetLocationReviewsUseCase,
    CreateLocationReviewUseCase,
    GetLocationTypeStatsUseCase,
  ],
})
export class AppModule {}
