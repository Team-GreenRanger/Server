import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from './entities/user.entity';
import { MissionEntity } from './entities/mission.entity';
import { UserMissionEntity } from './entities/user-mission.entity';
import { CarbonCreditEntity } from './entities/carbon-credit.entity';
import { CarbonCreditTransactionEntity } from './entities/carbon-credit-transaction.entity';
import { RewardEntity } from './entities/reward.entity';
import { UserRewardEntity } from './entities/user-reward.entity';
import { NotificationEntity } from './entities/notification.entity';
import { EcoLocationEntity } from './entities/eco-location.entity';
import { AiConversationEntity, AiMessageEntity } from './entities/ai-conversation.entity';

export const createDataSource = (configService: ConfigService) => {
  return new DataSource({
    type: 'mysql',
    host: configService.get('DATABASE_HOST', 'localhost'),
    port: configService.get('DATABASE_PORT', 3306),
    username: configService.get('DATABASE_USERNAME', 'root'),
    password: configService.get('DATABASE_PASSWORD', ''),
    database: configService.get('DATABASE_NAME', 'ecolife'),
    entities: [
      UserEntity,
      MissionEntity,
      UserMissionEntity,
      CarbonCreditEntity,
      CarbonCreditTransactionEntity,
      RewardEntity,
      UserRewardEntity,
      NotificationEntity,
      EcoLocationEntity,
      AiConversationEntity,
      AiMessageEntity,
    ],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    synchronize: configService.get('NODE_ENV') === 'development',
    logging: configService.get('NODE_ENV') === 'development',
    timezone: 'Z',
  });
};

// For CLI usage
const configService = new ConfigService();
export default createDataSource(configService);
