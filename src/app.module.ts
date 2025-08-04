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
import { AiConversationEntity, AiMessageEntity } from './infrastructure/database/entities/ai-conversation.entity';
import { UserEntity } from './infrastructure/database/entities/user.entity';
import { MissionEntity } from './infrastructure/database/entities/mission.entity';
import { UserMissionEntity } from './infrastructure/database/entities/user-mission.entity';

// Infrastructure Services (moved to SharedServicesModule)
// Repository implementations
import { TypeOrmCarbonCreditRepository } from './infrastructure/database/repositories/typeorm-carbon-credit.repository';
import { TypeOrmRewardRepository, TypeOrmUserRewardRepository } from './infrastructure/database/repositories/typeorm-reward.repository';
import { TypeOrmConversationRepository } from './infrastructure/database/repositories/typeorm-conversation.repository';
import { TypeOrmMessageRepository } from './infrastructure/database/repositories/typeorm-message.repository';
import { TypeOrmUserRepository } from './infrastructure/database/repositories/typeorm-user.repository';
import { TypeOrmRankingRepository } from './infrastructure/database/repositories/typeorm-ranking.repository';
import { CARBON_CREDIT_REPOSITORY } from './domain/carbon-credit/repositories/carbon-credit.repository.interface';
import { REWARD_REPOSITORY, USER_REWARD_REPOSITORY } from './domain/reward/repositories/reward.repository.interface';
import { CONVERSATION_REPOSITORY, MESSAGE_REPOSITORY } from './domain/ai-assistant/repositories/ai-assistant.repository.interface';
import { USER_REPOSITORY } from './domain/user/repositories/user.repository.interface';
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

// Presentation Controllers
import { AIAssistantController } from './presentation/ai-assistant/controllers/ai-assistant.controller';
import { CarbonCreditController } from './presentation/carbon-credit/controllers/carbon-credit.controller';
import { UploadController } from './presentation/upload/upload.controller';
import { UserController } from './presentation/user/controllers/user.controller';
import { RankingController } from './presentation/ranking/controllers/ranking.controller';
import { RewardController } from './presentation/reward/controllers/reward.controller';

// Modules
import { AuthModule } from './presentation/auth/auth.module';
import { UserModule } from './presentation/user/user.module';
import { MissionModule } from './presentation/mission/mission.module';
import { AdminModule } from './presentation/admin/admin.module';
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
      AiConversationEntity,
      AiMessageEntity,
      MissionEntity,
      UserMissionEntity,
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

    // Multer for file uploads (Memory Storage)
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        storage: require('multer').memoryStorage(), // 메모리 저장소 사용
        limits: {
          fileSize: 5 * 1024 * 1024, // 5MB
          files: 10, // 최대 파일 수
        },
        fileFilter: (req: any, file: any, cb: any) => {
          // 이미지 파일만 허용
          if (file.mimetype.startsWith('image/')) {
            cb(null, true);
          } else {
            cb(new Error('Only image files are allowed'), false);
          }
        },
      }),
    }),

    // Feature Modules
    SharedServicesModule,
    AuthModule,
    UserModule,
    MissionModule,
    AdminModule,
  ],
  controllers: [
    AIAssistantController,
    CarbonCreditController,
    UploadController,
    UserController,
    RankingController,
    RewardController,
  ],
  providers: [
    // Repository implementations
    {
      provide: USER_REPOSITORY,
      useClass: TypeOrmUserRepository,
    },
    {
      provide: CONVERSATION_REPOSITORY,
      useClass: TypeOrmConversationRepository,
    },
    {
      provide: MESSAGE_REPOSITORY,
      useClass: TypeOrmMessageRepository,
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
  ],
})
export class AppModule {}
