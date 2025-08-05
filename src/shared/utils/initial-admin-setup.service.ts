import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../infrastructure/database/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * 서버 시작 시 기본 관리자 계정을 생성하는 서비스
 * - admin@ncloud.sbs / password!! 크리덴셜로 관리자 계정 자동 생성
 */
@Injectable()
export class InitialAdminSetupService implements OnModuleInit {
  private readonly logger = new Logger(InitialAdminSetupService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * 모듈 초기화 시 실행 - 기본 관리자 계정 생성
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.createInitialAdminAccount();
    } catch (error) {
      this.logger.error('Failed to create initial admin account', error);
      // 에러가 발생해도 서버 시작을 중단하지 않음
    }
  }

  /**
   * 기본 관리자 계정 생성 로직
   */
  private async createInitialAdminAccount(): Promise<void> {
    const adminEmail = 'admin@ncloud.sbs';
    const adminPassword = 'password!!';

    try {
      // 이미 관리자 계정이 존재하는지 확인
      const existingAdmin = await this.userRepository.findOne({
        where: { email: adminEmail },
      });

      if (existingAdmin) {
        this.logger.log(`Admin account already exists: ${adminEmail}`);
        return;
      }

      // 비밀번호 해시화 (bcrypt, salt rounds: 12)
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

      // 관리자 계정 생성
      const adminUser = new UserEntity();
      adminUser.id = uuidv4();
      adminUser.email = adminEmail;
      adminUser.name = 'System Administrator';
      adminUser.hashedPassword = hashedPassword;
      adminUser.isAdmin = true;
      adminUser.isVerified = true;
      adminUser.isActive = true;
      adminUser.nationality = 'KR';

      // 데이터베이스에 저장
      await this.userRepository.save(adminUser);

      this.logger.log(`✅ Initial admin account created successfully`);
      this.logger.log(`📧 Email: ${adminEmail}`);
      this.logger.log(`🔑 Password: ${adminPassword}`);
      this.logger.warn('⚠️  Please change the default password after first login!');

    } catch (error) {
      this.logger.error('Error creating initial admin account:', error);
      
      // 구체적인 에러 메시지 로깅
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        this.logger.warn('Admin account already exists (duplicate entry)');
      } else {
        throw error; // 다른 에러는 재throw
      }
    }
  }

  /**
   * 관리자 계정 존재 여부 확인 (옵셔널 유틸리티 메서드)
   */
  async checkAdminExists(): Promise<boolean> {
    try {
      const adminCount = await this.userRepository.count({
        where: { isAdmin: true },
      });
      return adminCount > 0;
    } catch (error) {
      this.logger.error('Error checking admin existence:', error);
      return false;
    }
  }
}
