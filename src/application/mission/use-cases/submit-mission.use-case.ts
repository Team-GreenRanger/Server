import { Injectable, Inject } from '@nestjs/common';
import { UserMission } from '../../../domain/mission/entities/user-mission.entity';
import type { IUserMissionRepository } from '../../../domain/mission/repositories/mission.repository.interface';
import { USER_MISSION_REPOSITORY } from '../../../domain/mission/repositories/mission.repository.interface';

export interface SubmitMissionCommand {
  userMissionId: string;
  imageUrls: string[];
  note?: string;
}

@Injectable()
export class SubmitMissionUseCase {
  constructor(
    @Inject(USER_MISSION_REPOSITORY)
    private readonly userMissionRepository: IUserMissionRepository,
  ) {}

  async execute(command: SubmitMissionCommand): Promise<UserMission> {
    // Find user mission
    const userMission = await this.userMissionRepository.findById(command.userMissionId);
    if (!userMission) {
      throw new Error('User mission not found');
    }

    // Validate submission
    if (!userMission.canSubmit()) {
      throw new Error('Mission cannot be submitted in current status');
    }

    if (!command.imageUrls || command.imageUrls.length === 0) {
      throw new Error('At least one image is required for submission');
    }

    // Submit evidence
    userMission.submitEvidence(command.imageUrls, command.note);

    // Save updated user mission
    return await this.userMissionRepository.save(userMission);
  }
}
