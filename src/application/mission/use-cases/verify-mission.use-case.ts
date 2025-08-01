import { Injectable, Inject } from '@nestjs/common';
import { UserMission } from '../../../domain/mission/entities/user-mission.entity';
import { CarbonCredit, CarbonCreditTransaction, TransactionType } from '../../../domain/carbon-credit/entities/carbon-credit.entity';
import type { IUserMissionRepository } from '../../../domain/mission/repositories/mission.repository.interface';
import { USER_MISSION_REPOSITORY } from '../../../domain/mission/repositories/mission.repository.interface';
import type { ICarbonCreditRepository } from '../../../domain/carbon-credit/repositories/carbon-credit.repository.interface';
import { CARBON_CREDIT_REPOSITORY } from '../../../domain/carbon-credit/repositories/carbon-credit.repository.interface';
import type { IMissionRepository } from '../../../domain/mission/repositories/mission.repository.interface';
import { MISSION_REPOSITORY } from '../../../domain/mission/repositories/mission.repository.interface';

export interface VerifyMissionCommand {
  userMissionId: string;
  isApproved: boolean;
  verificationNote?: string;
}

export interface VerifyMissionResult {
  userMission: UserMission;
  creditTransaction?: CarbonCreditTransaction;
}

@Injectable()
export class VerifyMissionUseCase {
  constructor(
    @Inject(USER_MISSION_REPOSITORY)
    private readonly userMissionRepository: IUserMissionRepository,
    @Inject(MISSION_REPOSITORY)
    private readonly missionRepository: IMissionRepository,
    @Inject(CARBON_CREDIT_REPOSITORY)
    private readonly carbonCreditRepository: ICarbonCreditRepository,
  ) {}

  async execute(command: VerifyMissionCommand): Promise<VerifyMissionResult> {
    // Find user mission
    const userMission = await this.userMissionRepository.findById(command.userMissionId);
    if (!userMission) {
      throw new Error('User mission not found');
    }

    // Validate verification
    if (!userMission.canVerify()) {
      throw new Error('Mission cannot be verified in current status');
    }

    if (command.isApproved) {
      // Approve mission
      userMission.verify(command.verificationNote);
      userMission.complete();

      // Get mission details for credit calculation
      const mission = await this.missionRepository.findById(userMission.missionId);
      if (!mission) {
        throw new Error('Mission not found');
      }

      // Award carbon credits
      let carbonCredit = await this.carbonCreditRepository.findByUserId(userMission.userId);
      if (!carbonCredit) {
        carbonCredit = CarbonCredit.create(userMission.userId);
      }

      // Create transaction
      const transaction = CarbonCreditTransaction.create({
        userId: userMission.userId,
        type: TransactionType.EARNED,
        amount: mission.creditReward,
        description: `Mission completed: ${mission.title}`,
        sourceType: 'MISSION',
        sourceId: mission.id,
      });

      // Award credits
      carbonCredit.earn(mission.creditReward);
      transaction.complete();

      // Save updates
      await this.carbonCreditRepository.save(carbonCredit);
      const savedTransaction = await this.carbonCreditRepository.saveTransaction(transaction);
      const savedUserMission = await this.userMissionRepository.save(userMission);

      return {
        userMission: savedUserMission,
        creditTransaction: savedTransaction,
      };
    } else {
      // Reject mission
      userMission.reject(command.verificationNote || 'Mission verification failed');
      const savedUserMission = await this.userMissionRepository.save(userMission);

      return {
        userMission: savedUserMission,
      };
    }
  }
}
