import { Injectable, Inject } from '@nestjs/common';
import { UserMission, UserMissionStatus } from '../../../domain/mission/entities/user-mission.entity';
import type { IUserMissionRepository, IMissionRepository } from '../../../domain/mission/repositories/mission.repository.interface';
import { USER_MISSION_REPOSITORY, MISSION_REPOSITORY } from '../../../domain/mission/repositories/mission.repository.interface';
import { ClaudeService } from '../../../infrastructure/external-apis/claude/claude.service';

export interface SubmitMissionCommand {
  userMissionId: string;
  imageUrls: string[];
  note?: string;
}

export interface SubmitMissionResult {
  userMission: UserMission;
  isAutoVerified: boolean;
  verificationResult?: {
    isValid: boolean;
    confidence: number;
    reasoning: string;
  };
}

@Injectable()
export class SubmitMissionUseCase {
  constructor(
    @Inject(USER_MISSION_REPOSITORY)
    private readonly userMissionRepository: IUserMissionRepository,
    @Inject(MISSION_REPOSITORY)
    private readonly missionRepository: IMissionRepository,
    private readonly claudeService: ClaudeService,
  ) {}

  async execute(command: SubmitMissionCommand): Promise<SubmitMissionResult> {
    console.log('=== SUBMIT MISSION USE CASE START ===');
    console.log('Command:', command);
    console.log('User Mission ID:', command.userMissionId);
    console.log('Image URLs count:', command.imageUrls?.length);
    console.log('Image URLs:', command.imageUrls);
    console.log('Note:', command.note);
    
    // Find user mission
    console.log('Finding user mission...');
    const userMission = await this.userMissionRepository.findById(command.userMissionId);
    if (!userMission) {
      console.error('User mission not found for ID:', command.userMissionId);
      throw new Error('User mission not found');
    }
    console.log('User mission found:', {
      id: userMission.id,
      userId: userMission.userId,
      missionId: userMission.missionId,
      status: userMission.status,
      currentProgress: userMission.currentProgress
    });

    // Get mission details for verification
    console.log('Finding mission details...');
    const mission = await this.missionRepository.findById(userMission.missionId);
    if (!mission) {
      console.error('Mission not found for ID:', userMission.missionId);
      throw new Error('Mission not found');
    }
    console.log('Mission found:', {
      id: mission.id,
      title: mission.title,
      description: mission.description?.substring(0, 100) + '...',
      verificationCriteria: mission.verificationCriteria
    });

    // Validate submission
    console.log('Validating submission...');
    console.log('Can submit?', userMission.canSubmit());
    console.log('Current status:', userMission.status);
    console.log('Current progress:', userMission.currentProgress);
    console.log('Required submissions:', mission.requiredSubmissions);
    
    if (!userMission.canSubmit()) {
      console.error('=== SUBMISSION VALIDATION FAILED ===');
      console.error('Mission cannot be submitted in current status:', userMission.status);
      console.error('Valid statuses for submission are: ASSIGNED, IN_PROGRESS, REJECTED');
      console.error('UserMission details:', {
        id: userMission.id,
        userId: userMission.userId,
        missionId: userMission.missionId,
        status: userMission.status,
        currentProgress: userMission.currentProgress,
        submittedAt: userMission.submittedAt,
        verifiedAt: userMission.verifiedAt,
        completedAt: userMission.completedAt
      });
      throw new Error('Mission cannot be submitted in current status');
    }

    if (!command.imageUrls || command.imageUrls.length === 0) {
      console.error('No images provided for submission');
      throw new Error('At least one image is required for submission');
    }
    console.log('Validation passed');

    // Submit evidence
    console.log('Submitting evidence...');
    if (userMission.status === UserMissionStatus.ASSIGNED) {
      console.log('Starting progress (ASSIGNED -> IN_PROGRESS)');
      userMission.startProgress();
    }
    
    console.log('Calling submitEvidence on userMission...');
    userMission.submitEvidence(command.imageUrls, command.note);
    console.log('Evidence submitted, new status:', userMission.status);

    // Save submission first
    console.log('Saving user mission...');
    const savedUserMission = await this.userMissionRepository.save(userMission);
    console.log('User mission saved with ID:', savedUserMission.id);
    console.log('New status after save:', savedUserMission.status);

    // Auto-verify with Claude API using detailed mission information
    console.log('=== STARTING AUTO-VERIFICATION ===');
    console.log('Mission details:');
    console.log('- Mission ID:', mission.id);
    console.log('- Mission Title:', mission.title);
    console.log('- Mission Description:', mission.description);
    console.log('- Verification Criteria:', mission.verificationCriteria);
    console.log('- Image URLs:', command.imageUrls);
    console.log('- Note:', command.note);
    
    try {
      console.log('Calling Claude service verifyMissionWithDetails...');
      const verificationResult = await this.claudeService.verifyMissionWithDetails(
        mission.title,
        mission.description,
        mission.verificationCriteria,
        command.imageUrls,
        command.note
      );

      console.log('Claude verification result received:', verificationResult);
      console.log('- isValid:', verificationResult.isValid);
      console.log('- confidence:', verificationResult.confidence);
      console.log('- reasoning:', verificationResult.reasoning);
      console.log('- detectedElements:', verificationResult.detectedElements);
      console.log('- suggestions:', verificationResult.suggestions);
      console.log('=== AUTO-VERIFICATION SUCCESS ===');
      console.log('=== SUBMIT MISSION USE CASE END (AUTO-VERIFIED) ===');

      return {
        userMission: savedUserMission,
        isAutoVerified: true,
        verificationResult: {
          isValid: verificationResult.isValid,
          confidence: verificationResult.confidence,
          reasoning: verificationResult.reasoning,
        },
      };
    } catch (error) {
      // Claude API 실패시 수동 검증 대기 상태로 유지
      console.error('=== AUTO-VERIFICATION FAILED ===');
      console.error('Claude API verification failed - Error type:', error.constructor.name);
      console.error('Claude API verification failed - Error message:', error.message);
      console.error('Claude API verification failed - Error stack:', error.stack);
      console.error('Claude API verification failed - Full error:', error);
      console.error('=== SUBMIT MISSION USE CASE END (AUTO-VERIFICATION FAILED) ===');
      
      return {
        userMission: savedUserMission,
        isAutoVerified: false,
      };
    }
  }
}
