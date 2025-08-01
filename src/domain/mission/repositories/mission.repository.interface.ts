import { Mission, MissionType, MissionStatus, DifficultyLevel } from '../entities/mission.entity';
import { UserMission, UserMissionStatus } from '../entities/user-mission.entity';

export interface IMissionRepository {
  save(mission: Mission): Promise<Mission>;
  findById(id: string): Promise<Mission | null>;
  findAll(): Promise<Mission[]>;
  findByStatus(status: MissionStatus): Promise<Mission[]>;
  findByType(type: MissionType): Promise<Mission[]>;
  findByDifficulty(difficulty: DifficultyLevel): Promise<Mission[]>;
  update(id: string, mission: Partial<Mission>): Promise<Mission>;
  delete(id: string): Promise<void>;
}

export interface IUserMissionRepository {
  save(userMission: UserMission): Promise<UserMission>;
  findById(id: string): Promise<UserMission | null>;
  findByUserId(userId: string): Promise<UserMission[]>;
  findByUserIdAndStatus(userId: string, status: UserMissionStatus): Promise<UserMission[]>;
  findByMissionId(missionId: string): Promise<UserMission[]>;
  findUserMissionWithMission(userId: string, missionId: string): Promise<UserMission | null>;
  findCompletedMissionsByUserId(userId: string): Promise<UserMission[]>;
  update(id: string, userMission: Partial<UserMission>): Promise<UserMission>;
  delete(id: string): Promise<void>;
  countCompletedMissions(userId: string): Promise<number>;
  findPendingVerifications(): Promise<UserMission[]>;
}

export const MISSION_REPOSITORY = Symbol('MISSION_REPOSITORY');
export const USER_MISSION_REPOSITORY = Symbol('USER_MISSION_REPOSITORY');
