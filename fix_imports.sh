#!/bin/bash

# Fix type imports in all affected files

# Mission use cases
sed -i 's/import { IMissionRepository, MISSION_REPOSITORY }/import type { IMissionRepository }; import { MISSION_REPOSITORY }/g' src/application/mission/use-cases/get-mission-by-id.use-case.ts
sed -i 's/import { IMissionRepository, MISSION_REPOSITORY }/import type { IMissionRepository }; import { MISSION_REPOSITORY }/g' src/application/mission/use-cases/get-missions.use-case.ts
sed -i 's/import { IUserMissionRepository, USER_MISSION_REPOSITORY }/import type { IUserMissionRepository }; import { USER_MISSION_REPOSITORY }/g' src/application/mission/use-cases/get-user-missions.use-case.ts

# Notification service  
sed -i 's/import { INotificationRepository, NOTIFICATION_REPOSITORY }/import type { INotificationRepository }; import { NOTIFICATION_REPOSITORY }/g' src/application/notification/services/notification.service.ts

# Ranking use cases
sed -i 's/import { IRankingRepository, RANKING_REPOSITORY, RankingData }/import type { IRankingRepository, RankingData }; import { RANKING_REPOSITORY }/g' src/application/ranking/use-cases/get-current-rankings.use-case.ts
sed -i 's/import { IRankingRepository, RANKING_REPOSITORY }/import type { IRankingRepository }; import { RANKING_REPOSITORY }/g' src/application/ranking/use-cases/get-current-user-ranking.use-case.ts

# Reward use cases  
sed -i 's/import { IRewardRepository, REWARD_REPOSITORY }/import type { IRewardRepository }; import { REWARD_REPOSITORY }/g' src/application/reward/use-cases/create-reward.use-case.ts
sed -i 's/import { IRewardRepository, REWARD_REPOSITORY }/import type { IRewardRepository }; import { REWARD_REPOSITORY }/g' src/application/reward/use-cases/delete-reward.use-case.ts
sed -i 's/import { IRewardRepository, REWARD_REPOSITORY }/import type { IRewardRepository }; import { REWARD_REPOSITORY }/g' src/application/reward/use-cases/get-reward-by-id.use-case.ts
sed -i 's/import { IRewardRepository, REWARD_REPOSITORY }/import type { IRewardRepository }; import { REWARD_REPOSITORY }/g' src/application/reward/use-cases/get-rewards.use-case.ts
sed -i 's/import { IRewardRepository, REWARD_REPOSITORY }/import type { IRewardRepository }; import { REWARD_REPOSITORY }/g' src/application/reward/use-cases/update-reward.use-case.ts

# Complex imports
sed -i 's/import { IRewardRepository, REWARD_REPOSITORY, IUserRewardRepository, USER_REWARD_REPOSITORY }/import type { IRewardRepository, IUserRewardRepository }; import { REWARD_REPOSITORY, USER_REWARD_REPOSITORY }/g' src/application/reward/use-cases/redeem-reward.use-case.ts
sed -i 's/import { IUserRewardRepository, USER_REWARD_REPOSITORY }/import type { IUserRewardRepository }; import { USER_REWARD_REPOSITORY }/g' src/application/reward/use-cases/get-user-reward-by-id.use-case.ts
sed -i 's/import { IUserRewardRepository, USER_REWARD_REPOSITORY }/import type { IUserRewardRepository }; import { USER_REWARD_REPOSITORY }/g' src/application/reward/use-cases/get-user-rewards.use-case.ts

echo "Type imports fixed"