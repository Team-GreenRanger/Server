import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeminiService } from '../../infrastructure/external-apis/gemini/gemini.service';
import { ClaudeService } from '../../infrastructure/external-apis/claude/claude.service';
import { NotificationService } from '../../application/notification/services/notification.service';
import { FileStorageService } from '../../infrastructure/file-storage/file-storage.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    GeminiService,
    ClaudeService,
    NotificationService,
    FileStorageService,
  ],
  exports: [
    GeminiService,
    ClaudeService,
    NotificationService,
    FileStorageService,
  ],
})
export class SharedServicesModule {}
