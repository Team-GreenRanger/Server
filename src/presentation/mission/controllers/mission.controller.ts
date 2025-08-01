import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Param, 
  Body, 
  Query, 
  UseGuards,
  Request
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery 
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AssignMissionUseCase } from '../../../application/mission/use-cases/assign-mission.use-case';
import { SubmitMissionUseCase } from '../../../application/mission/use-cases/submit-mission.use-case';
import { VerifyMissionUseCase } from '../../../application/mission/use-cases/verify-mission.use-case';
import { ClaudeService } from '../../../infrastructure/external-apis/claude/claude.service';
import { NotificationService } from '../../../application/notification/services/notification.service';
import { 
  MissionResponseDto,
  UserMissionResponseDto,
  AssignMissionDto,
  SubmitMissionDto,
  VerifyMissionDto,
  MissionStatusDto,
  UserMissionStatusDto
} from '../../../application/mission/dto/mission.dto';

@ApiTags('Missions')
@Controller('missions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MissionController {
  constructor(
    private readonly assignMissionUseCase: AssignMissionUseCase,
    private readonly submitMissionUseCase: SubmitMissionUseCase,
    private readonly verifyMissionUseCase: VerifyMissionUseCase,
    private readonly claudeService: ClaudeService,
    private readonly notificationService: NotificationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all available missions' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of missions', 
    type: [MissionResponseDto] 
  })
  @ApiQuery({ name: 'status', enum: MissionStatusDto, required: false })
  @ApiQuery({ name: 'type', required: false })
  async getMissions(
    @Query('status') status?: MissionStatusDto,
    @Query('type') type?: string,
  ): Promise<MissionResponseDto[]> {
    // TODO: Implement get missions use case
    return [];
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get mission by ID' })
  @ApiParam({ name: 'id', description: 'Mission ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Mission details', 
    type: MissionResponseDto 
  })
  async getMissionById(@Param('id') id: string): Promise<MissionResponseDto> {
    // TODO: Implement get mission by ID use case
    throw new Error('Not implemented');
  }

  @Post('assign')
  @ApiOperation({ summary: 'Assign mission to current user' })
  @ApiResponse({ 
    status: 201, 
    description: 'Mission assigned successfully', 
    type: UserMissionResponseDto 
  })
  async assignMission(
    @Request() req: any,
    @Body() assignMissionDto: AssignMissionDto,
  ): Promise<UserMissionResponseDto> {
    const userId = req.user.sub; // From JWT payload
    
    const userMission = await this.assignMissionUseCase.execute({
      userId,
      missionId: assignMissionDto.missionId,
      targetProgress: assignMissionDto.targetProgress,
    });

    return {
      id: userMission.id,
      userId: userMission.userId,
      missionId: userMission.missionId,
      status: userMission.status as unknown as UserMissionStatusDto,
      currentProgress: userMission.currentProgress,
      targetProgress: userMission.targetProgress,
      submissionImageUrls: userMission.submissionImageUrls,
      submissionNote: userMission.submissionNote,
      verificationNote: userMission.verificationNote,
      submittedAt: userMission.submittedAt,
      verifiedAt: userMission.verifiedAt,
      completedAt: userMission.completedAt,
      assignedAt: userMission.assignedAt,
    };
  }

  @Get('user/missions')
  @ApiOperation({ summary: 'Get current user missions' })
  @ApiResponse({ 
    status: 200, 
    description: 'User missions', 
    type: [UserMissionResponseDto] 
  })
  @ApiQuery({ name: 'status', enum: UserMissionStatusDto, required: false })
  async getUserMissions(
    @Request() req: any,
    @Query('status') status?: UserMissionStatusDto,
  ): Promise<UserMissionResponseDto[]> {
    // TODO: Implement get user missions use case
    return [];
  }

  @Patch('user-missions/:id/submit')
  @ApiOperation({ summary: 'Submit mission evidence with auto verification' })
  @ApiParam({ name: 'id', description: 'User Mission ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Mission submitted and verified automatically', 
    type: UserMissionResponseDto 
  })
  async submitMission(
    @Request() req: any,
    @Param('id') userMissionId: string,
    @Body() submitMissionDto: SubmitMissionDto,
  ): Promise<UserMissionResponseDto> {
    const userId = req.user.sub;
    
    // Submit mission first
    const userMission = await this.submitMissionUseCase.execute({
      userMissionId,
      imageUrls: submitMissionDto.imageUrls,
      note: submitMissionDto.note,
    });

    // Auto-verify using Claude API
    try {
      const verificationResult = await this.claudeService.verifyMissionEvidence(
        userMissionId,
        submitMissionDto.imageUrls,
        submitMissionDto.note
      );

      // Auto-approve or reject based on Claude's assessment
      const verifyResult = await this.verifyMissionUseCase.execute({
        userMissionId,
        isApproved: verificationResult.isValid,
        verificationNote: verificationResult.reasoning,
      });

      // Send notification based on result
      if (verificationResult.isValid) {
        await this.notificationService.createMissionCompletedNotification(
          userId,
          'Mission Title', // TODO: Get actual mission title
          500 // TODO: Get actual credit reward
        );
      }

      return {
        id: verifyResult.userMission.id,
        userId: verifyResult.userMission.userId,
        missionId: verifyResult.userMission.missionId,
        status: verifyResult.userMission.status as unknown as UserMissionStatusDto,
        currentProgress: verifyResult.userMission.currentProgress,
        targetProgress: verifyResult.userMission.targetProgress,
        submissionImageUrls: verifyResult.userMission.submissionImageUrls,
        submissionNote: verifyResult.userMission.submissionNote,
        verificationNote: verifyResult.userMission.verificationNote,
        submittedAt: verifyResult.userMission.submittedAt,
        verifiedAt: verifyResult.userMission.verifiedAt,
        completedAt: verifyResult.userMission.completedAt,
        assignedAt: verifyResult.userMission.assignedAt,
      };
    } catch (error) {
      console.error('Auto-verification failed:', error);
      
      // Return submitted mission if auto-verification fails
      return {
        id: userMission.id,
        userId: userMission.userId,
        missionId: userMission.missionId,
        status: userMission.status as unknown as UserMissionStatusDto,
        currentProgress: userMission.currentProgress,
        targetProgress: userMission.targetProgress,
        submissionImageUrls: userMission.submissionImageUrls,
        submissionNote: userMission.submissionNote,
        verificationNote: 'Auto-verification failed, pending manual review',
        submittedAt: userMission.submittedAt,
        verifiedAt: userMission.verifiedAt,
        completedAt: userMission.completedAt,
        assignedAt: userMission.assignedAt,
      };
    }
  }

  @Patch('user-missions/:id/verify')
  @ApiOperation({ summary: 'Verify submitted mission (Admin only)' })
  @ApiParam({ name: 'id', description: 'User Mission ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Mission verified successfully', 
    type: UserMissionResponseDto 
  })
  async verifyMission(
    @Param('id') userMissionId: string,
    @Body() verifyMissionDto: VerifyMissionDto,
  ): Promise<UserMissionResponseDto> {
    const result = await this.verifyMissionUseCase.execute({
      userMissionId,
      isApproved: verifyMissionDto.decision === 'approved',
      verificationNote: verifyMissionDto.verificationNote,
    });

    return {
      id: result.userMission.id,
      userId: result.userMission.userId,
      missionId: result.userMission.missionId,
      status: result.userMission.status as unknown as UserMissionStatusDto,
      currentProgress: result.userMission.currentProgress,
      targetProgress: result.userMission.targetProgress,
      submissionImageUrls: result.userMission.submissionImageUrls,
      submissionNote: result.userMission.submissionNote,
      verificationNote: result.userMission.verificationNote,
      submittedAt: result.userMission.submittedAt,
      verifiedAt: result.userMission.verifiedAt,
      completedAt: result.userMission.completedAt,
      assignedAt: result.userMission.assignedAt,
    };
  }
}
