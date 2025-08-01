import { Injectable, Inject } from '@nestjs/common';
import { ClaudeService } from '../../../infrastructure/external-apis/claude/claude.service';
import type { IMissionRepository } from '../../../domain/mission/repositories/mission.repository.interface';
import { MISSION_REPOSITORY } from '../../../domain/mission/repositories/mission.repository.interface';

export interface VerifyImageCommand {
  imageUrl: string;
  missionId: string;
  userId: string;
}

export interface VerifyImageResult {
  isValid: boolean;
  confidence: number;
  reasoning: string;
  detectedElements: string[];
  suggestions?: string[];
  verificationId: string;
  timestamp: Date;
}

@Injectable()
export class VerifyImageWithAIUseCase {
  constructor(
    private readonly claudeService: ClaudeService,
    @Inject(MISSION_REPOSITORY)
    private readonly missionRepository: IMissionRepository,
  ) {}

  async execute(command: VerifyImageCommand): Promise<VerifyImageResult> {
    // Get mission details for verification criteria
    const mission = await this.missionRepository.findById(command.missionId);
    if (!mission) {
      throw new Error('Mission not found');
    }

    if (!mission.isActive()) {
      throw new Error('Mission is not active');
    }

    try {
      const verificationResult = await this.claudeService.verifyMissionImage({
        imageUrl: command.imageUrl,
        missionDescription: mission.description,
        verificationCriteria: mission.verificationCriteria,
      });

      return {
        isValid: verificationResult.isValid,
        confidence: verificationResult.confidence,
        reasoning: verificationResult.reasoning,
        detectedElements: verificationResult.detectedElements,
        suggestions: verificationResult.suggestions,
        verificationId: this.generateVerificationId(),
        timestamp: new Date(),
      };
    } catch (error) {
      throw new Error(`Image verification failed: ${error.message}`);
    }
  }

  private generateVerificationId(): string {
    return `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
