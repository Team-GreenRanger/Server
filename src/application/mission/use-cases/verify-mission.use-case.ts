import { Injectable, Inject } from '@nestjs/common';
import { UserMission } from '../../../domain/mission/entities/user-mission.entity';
import { CarbonCredit, CarbonCreditTransaction, TransactionType } from '../../../domain/carbon-credit/entities/carbon-credit.entity';
import type { IUserMissionRepository } from '../../../domain/mission/repositories/mission.repository.interface';
import { USER_MISSION_REPOSITORY } from '../../../domain/mission/repositories/mission.repository.interface';
import type { ICarbonCreditRepository } from '../../../domain/carbon-credit/repositories/carbon-credit.repository.interface';
import { CARBON_CREDIT_REPOSITORY } from '../../../domain/carbon-credit/repositories/carbon-credit.repository.interface';
import type { IMissionRepository } from '../../../domain/mission/repositories/mission.repository.interface';
import { MISSION_REPOSITORY } from '../../../domain/mission/repositories/mission.repository.interface';
import type { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../../../domain/user/repositories/user.repository.interface';

export interface VerifyMissionCommand {
  userMissionId: string;
  isApproved: boolean;
  verificationNote?: string;
  isAutoVerification?: boolean;
}

export interface VerifyMissionResult {
  userMission: UserMission;
  creditTransaction?: CarbonCreditTransaction;
  isFullyCompleted: boolean;
  remainingSubmissions: number;
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
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: VerifyMissionCommand): Promise<VerifyMissionResult> {
    console.log('=== VERIFY MISSION USE CASE START ===');
    console.log('Command:', {
      userMissionId: command.userMissionId,
      isApproved: command.isApproved,
      verificationNote: command.verificationNote,
      isAutoVerification: command.isAutoVerification
    });
    
    // Find user mission
    const userMission = await this.userMissionRepository.findById(command.userMissionId);
    if (!userMission) {
      console.error('User mission not found:', command.userMissionId);
      throw new Error('User mission not found');
    }
    console.log('User mission found:', {
      id: userMission.id,
      userId: userMission.userId,
      missionId: userMission.missionId,
      status: userMission.status,
      currentProgress: userMission.currentProgress
    });

    // Get mission details for progress calculation
    const mission = await this.missionRepository.findById(userMission.missionId);
    if (!mission) {
      console.error('Mission not found:', userMission.missionId);
      throw new Error('Mission not found');
    }
    console.log('Mission found:', {
      id: mission.id,
      title: mission.title,
      requiredSubmissions: mission.requiredSubmissions
    });

    // Validate verification
    console.log('Can verify?', userMission.canVerify());
    if (!userMission.canVerify()) {
      console.error('Mission cannot be verified in current status:', userMission.status);
      throw new Error('Mission cannot be verified in current status');
    }

    if (command.isApproved) {
      console.log('=== APPROVING MISSION ===');
      // Approve mission
      userMission.verify(command.verificationNote);
      console.log('Mission verified, new status:', userMission.status);
      
      // 진행률 증가
      const previousProgress = userMission.currentProgress;
      userMission.incrementProgress(mission.requiredSubmissions);
      console.log('Progress incremented:', {
        previous: previousProgress,
        current: userMission.currentProgress,
        required: mission.requiredSubmissions
      });
      
      // requiredSubmissions 기반으로 완료 여부 확인
      const isFullyCompleted = userMission.isFullyCompleted(mission.requiredSubmissions);
      const remainingSubmissions = userMission.getRemainingSubmissions(mission.requiredSubmissions);
      console.log('Completion check:', {
        isFullyCompleted,
        remainingSubmissions
      });
      
      if (isFullyCompleted) {
        console.log('=== MISSION FULLY COMPLETED ===');
        // 모든 제출이 완료된 경우에만 크레딧 지급 및 COMPLETED 상태 변경
        userMission.complete();
        console.log('Mission completed, final status:', userMission.status);

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
        
        // Increment user's total mission solved count
        console.log('Incrementing user total mission solved count');
        await this.userRepository.incrementMissionSolved(userMission.userId);
        console.log('User total mission solved count incremented');

        console.log('=== VERIFY MISSION USE CASE END (COMPLETED) ===');
        return {
          userMission: savedUserMission,
          creditTransaction: savedTransaction,
          isFullyCompleted: true,
          remainingSubmissions: 0,
        };
      } else {
        console.log('=== MISSION NEEDS MORE SUBMISSIONS ===');
        // 아직 더 제출이 필요한 경우 - IN_PROGRESS 상태로 되돌림
        userMission.continueProgress();
        console.log('Mission continued, new status:', userMission.status);
        
        const savedUserMission = await this.userMissionRepository.save(userMission);
        console.log('User mission saved for continuation');
        
        console.log('=== VERIFY MISSION USE CASE END (CONTINUING) ===');
        return {
          userMission: savedUserMission,
          isFullyCompleted: false,
          remainingSubmissions,
        };
      }
    } else {
      console.log('=== REJECTING MISSION ===');
      // Reject mission - 진행률은 증가시키지 않음
      userMission.reject(command.verificationNote || 'Mission verification failed');
      console.log('Mission rejected, new status:', userMission.status);
      const savedUserMission = await this.userMissionRepository.save(userMission);
      console.log('Rejected user mission saved');
      
      const remainingSubmissions = userMission.getRemainingSubmissions(mission.requiredSubmissions);

      console.log('=== VERIFY MISSION USE CASE END (REJECTED) ===');
      return {
        userMission: savedUserMission,
        isFullyCompleted: false,
        remainingSubmissions,
      };
    }
  }
}
