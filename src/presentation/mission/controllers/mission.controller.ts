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
import { AdminGuard } from '../../auth/guards/admin.guard';
import { Admin } from '../../auth/decorators/admin.decorator';
import { AssignMissionUseCase } from '../../../application/mission/use-cases/assign-mission.use-case';
import { SubmitMissionUseCase } from '../../../application/mission/use-cases/submit-mission.use-case';
import { VerifyMissionUseCase } from '../../../application/mission/use-cases/verify-mission.use-case';
import { GetMissionsUseCase } from '../../../application/mission/use-cases/get-missions.use-case';
import { GetMissionByIdUseCase } from '../../../application/mission/use-cases/get-mission-by-id.use-case';
import { GetUserMissionsUseCase } from '../../../application/mission/use-cases/get-user-missions.use-case';
import { GetDailyMissionsUseCase } from '../../../application/mission/use-cases/get-daily-missions.use-case';
import { CreateMissionUseCase } from '../../../application/mission/use-cases/create-mission.use-case';
import { ClaudeService } from '../../../infrastructure/external-apis/claude/claude.service';
import { NotificationService } from '../../../application/notification/services/notification.service';
import {
  MissionResponseDto,
  UserMissionResponseDto,
  AssignMissionDto,
  SubmitMissionDto,
  VerifyMissionDto,
  CreateMissionDto,
  MissionStatusDto,
  UserMissionStatusDto,
  MissionTypeDto,
  DifficultyLevelDto
} from '../../../application/mission/dto/mission.dto';
import { MissionStatus } from '../../../domain/mission/entities/mission.entity';
import { Mission } from '../../../domain/mission/entities/mission.entity';

@ApiTags('Missions')
@Controller('missions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MissionController {
  constructor(
      private readonly assignMissionUseCase: AssignMissionUseCase,
      private readonly submitMissionUseCase: SubmitMissionUseCase,
      private readonly verifyMissionUseCase: VerifyMissionUseCase,
      private readonly getMissionsUseCase: GetMissionsUseCase,
      private readonly getMissionByIdUseCase: GetMissionByIdUseCase,
      private readonly getUserMissionsUseCase: GetUserMissionsUseCase,
      private readonly getDailyMissionsUseCase: GetDailyMissionsUseCase,
      private readonly createMissionUseCase: CreateMissionUseCase,
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
    const result = await this.getMissionsUseCase.execute({
      status: status as unknown as MissionStatus,
      type,
    });

    return result.missions.map(mission => ({
      id: mission.id,
      title: mission.title,
      description: mission.description,
      type: mission.type as unknown as MissionTypeDto,
      difficulty: mission.difficulty as unknown as DifficultyLevelDto,
      co2ReductionAmount: mission.co2ReductionAmount,
      creditReward: mission.creditReward,
      requiredSubmissions: mission.requiredSubmissions,
      imageUrl: mission.imageUrl,
      instructions: mission.instructions,
      verificationCriteria: mission.verificationCriteria,
      status: mission.status as unknown as MissionStatusDto,
      createdAt: mission.createdAt,
    }));
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
    const result = await this.getMissionByIdUseCase.execute({ id });
    const mission = result.mission;

    return {
      id: mission.id,
      title: mission.title,
      description: mission.description,
      type: mission.type as unknown as MissionTypeDto,
      difficulty: mission.difficulty as unknown as DifficultyLevelDto,
      co2ReductionAmount: mission.co2ReductionAmount,
      creditReward: mission.creditReward,
      requiredSubmissions: mission.requiredSubmissions,
      imageUrl: mission.imageUrl,
      instructions: mission.instructions,
      verificationCriteria: mission.verificationCriteria,
      status: mission.status as unknown as MissionStatusDto,
      createdAt: mission.createdAt,
    };
  }

  @Post()
  @Admin()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create new mission (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Mission created successfully',
    type: MissionResponseDto
  })
  async createMission(@Body() createMissionDto: CreateMissionDto): Promise<MissionResponseDto> {
    const result = await this.createMissionUseCase.execute({
      title: createMissionDto.title,
      description: createMissionDto.description,
      type: createMissionDto.type as any,
      difficulty: createMissionDto.difficulty as any,
      co2ReductionAmount: createMissionDto.co2ReductionAmount,
      creditReward: createMissionDto.creditReward,
      requiredSubmissions: createMissionDto.requiredSubmissions,
      imageUrl: createMissionDto.imageUrl,
      instructions: createMissionDto.instructions,
      verificationCriteria: createMissionDto.verificationCriteria,
    });

    const mission = result.mission;

    return {
      id: mission.id,
      title: mission.title,
      description: mission.description,
      type: mission.type as unknown as MissionTypeDto,
      difficulty: mission.difficulty as unknown as DifficultyLevelDto,
      co2ReductionAmount: mission.co2ReductionAmount,
      creditReward: mission.creditReward,
      requiredSubmissions: mission.requiredSubmissions,
      imageUrl: mission.imageUrl,
      instructions: mission.instructions,
      verificationCriteria: mission.verificationCriteria,
      status: mission.status as unknown as MissionStatusDto,
      createdAt: mission.createdAt,
    };
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
      isActive: userMission.status !== 'COMPLETED',
      isDone: userMission.status === 'COMPLETED',
    };
  }

  @Get('user/daily-missions')
  @ApiOperation({ summary: 'Get daily missions for current user (assigns if not exists)' })
  @ApiResponse({
    status: 200,
    description: 'Daily missions for user',
    type: [UserMissionResponseDto]
  })
  async getDailyMissions(@Request() req: any): Promise<UserMissionResponseDto[]> {
    const userId = req.user.sub;

    const result = await this.getDailyMissionsUseCase.execute({ userId });

    return result.userMissions.map(userMission => {
      const userMissionWithMission = userMission as typeof userMission & { mission?: Mission | null };
      return {
        id: userMissionWithMission.id,
        userId: userMissionWithMission.userId,
        missionId: userMissionWithMission.missionId,
        status: userMissionWithMission.status as unknown as UserMissionStatusDto,
        currentProgress: userMissionWithMission.currentProgress,
        targetProgress: userMissionWithMission.targetProgress,
        submissionImageUrls: userMissionWithMission.submissionImageUrls,
        submissionNote: userMissionWithMission.submissionNote,
        verificationNote: userMissionWithMission.verificationNote,
        submittedAt: userMissionWithMission.submittedAt,
        verifiedAt: userMissionWithMission.verifiedAt,
        completedAt: userMissionWithMission.completedAt,
        assignedAt: userMissionWithMission.assignedAt,
        isActive: userMissionWithMission.status !== 'COMPLETED',
        isDone: userMissionWithMission.status === 'COMPLETED',
        mission: userMissionWithMission.mission ? {
          id: userMissionWithMission.mission.id,
          title: userMissionWithMission.mission.title,
          description: userMissionWithMission.mission.description,
          type: userMissionWithMission.mission.type as unknown as MissionTypeDto,
          difficulty: userMissionWithMission.mission.difficulty as unknown as DifficultyLevelDto,
          co2ReductionAmount: userMissionWithMission.mission.co2ReductionAmount,
          creditReward: userMissionWithMission.mission.creditReward,
          requiredSubmissions: userMissionWithMission.mission.requiredSubmissions,
          imageUrl: userMissionWithMission.mission.imageUrl,
          instructions: userMissionWithMission.mission.instructions,
          verificationCriteria: userMissionWithMission.mission.verificationCriteria,
          status: userMissionWithMission.mission.status as unknown as MissionStatusDto,
          createdAt: userMissionWithMission.mission.createdAt,
        } : undefined,
      };
    });
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
    const userId = req.user.sub;

    const result = await this.getUserMissionsUseCase.execute({
      userId,
      status: status as any,
    });

    return result.userMissions.map(userMission => {
      const userMissionWithMission = userMission as typeof userMission & { mission?: Mission | null };
      return {
        id: userMissionWithMission.id,
        userId: userMissionWithMission.userId,
        missionId: userMissionWithMission.missionId,
        status: userMissionWithMission.status as unknown as UserMissionStatusDto,
        currentProgress: userMissionWithMission.currentProgress,
        targetProgress: userMissionWithMission.targetProgress,
        submissionImageUrls: userMissionWithMission.submissionImageUrls,
        submissionNote: userMissionWithMission.submissionNote,
        verificationNote: userMissionWithMission.verificationNote,
        submittedAt: userMissionWithMission.submittedAt,
        verifiedAt: userMissionWithMission.verifiedAt,
        completedAt: userMissionWithMission.completedAt,
        assignedAt: userMissionWithMission.assignedAt,
        isActive: userMissionWithMission.status !== 'COMPLETED',
        isDone: userMissionWithMission.status === 'COMPLETED',
        mission: userMissionWithMission.mission ? {
          id: userMissionWithMission.mission.id,
          title: userMissionWithMission.mission.title,
          description: userMissionWithMission.mission.description,
          type: userMissionWithMission.mission.type as unknown as MissionTypeDto,
          difficulty: userMissionWithMission.mission.difficulty as unknown as DifficultyLevelDto,
          co2ReductionAmount: userMissionWithMission.mission.co2ReductionAmount,
          creditReward: userMissionWithMission.mission.creditReward,
          requiredSubmissions: userMissionWithMission.mission.requiredSubmissions,
          imageUrl: userMissionWithMission.mission.imageUrl,
          instructions: userMissionWithMission.mission.instructions,
          verificationCriteria: userMissionWithMission.mission.verificationCriteria,
          status: userMissionWithMission.mission.status as unknown as MissionStatusDto,
          createdAt: userMissionWithMission.mission.createdAt,
        } : undefined,
      };
    });
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
  ): Promise<UserMissionResponseDto & { isFullyCompleted: boolean; remainingSubmissions: number; points: number }> {
    const userId = req.user.sub;

    // Submit mission with auto-verification
    const submitResult = await this.submitMissionUseCase.execute({
      userMissionId,
      imageUrls: submitMissionDto.imageUrls,
      note: submitMissionDto.note,
    });

    // If auto-verified, proceed with verification
    if (submitResult.isAutoVerified && submitResult.verificationResult) {
      const verifyResult = await this.verifyMissionUseCase.execute({
        userMissionId,
        isApproved: submitResult.verificationResult.isValid,
        verificationNote: submitResult.verificationResult.reasoning,
        isAutoVerification: true,
      });

      // Send notification if fully completed
      if (verifyResult.isFullyCompleted && verifyResult.creditTransaction) {
        const missionResult = await this.getMissionByIdUseCase.execute({
          id: submitResult.userMission.missionId
        });

        await this.notificationService.createMissionCompletedNotification(
            userId,
            missionResult.mission.title,
            missionResult.mission.creditReward
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
        isActive: verifyResult.userMission.status !== 'COMPLETED',
        isDone: verifyResult.userMission.status === 'COMPLETED',
        isFullyCompleted: verifyResult.isFullyCompleted,
        remainingSubmissions: verifyResult.remainingSubmissions,
        points: verifyResult.isFullyCompleted && verifyResult.creditTransaction ? verifyResult.creditTransaction.amount : 0,
      };
    } else {
      // Auto-verification failed or not performed
      return {
        id: submitResult.userMission.id,
        userId: submitResult.userMission.userId,
        missionId: submitResult.userMission.missionId,
        status: submitResult.userMission.status as unknown as UserMissionStatusDto,
        currentProgress: submitResult.userMission.currentProgress,
        targetProgress: submitResult.userMission.targetProgress,
        submissionImageUrls: submitResult.userMission.submissionImageUrls,
        submissionNote: submitResult.userMission.submissionNote,
        verificationNote: 'Pending verification',
        submittedAt: submitResult.userMission.submittedAt,
        verifiedAt: submitResult.userMission.verifiedAt,
        completedAt: submitResult.userMission.completedAt,
        assignedAt: submitResult.userMission.assignedAt,
        isActive: submitResult.userMission.status !== 'COMPLETED',
        isDone: submitResult.userMission.status === 'COMPLETED',
        isFullyCompleted: false,
        remainingSubmissions: submitResult.userMission.targetProgress - submitResult.userMission.currentProgress,
        points: 0,
      };
    }
  }

  @Patch('user-missions/:id/verify')
  @Admin()
  @UseGuards(AdminGuard)
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
      isActive: result.userMission.status !== 'COMPLETED',
      isDone: result.userMission.status === 'COMPLETED',
    };
  }
}