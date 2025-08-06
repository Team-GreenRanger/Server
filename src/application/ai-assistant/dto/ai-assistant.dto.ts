import { IsString, IsUrl, IsUUID, IsOptional, IsArray, ValidateNested, IsISO8601, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ChatMessageDto {
  @ApiProperty({ enum: ['user', 'assistant'], description: 'Message role' })
  @IsString()
  role: 'user' | 'assistant';

  @ApiProperty({ description: 'Message content' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Message timestamp' })
  @IsOptional()
  @IsISO8601()
  timestamp?: string;
}

export class ChatWithAIDto {
  @ApiProperty({ description: 'User message to AI assistant', example: 'How can I reduce my carbon footprint?' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ 
    description: 'Conversation ID (optional for new conversations)' 
  })
  @IsOptional()
  @IsUUID()
  conversationId?: string;
}

export class ChatWithAIResponseDto {
  @ApiProperty({ description: 'AI assistant response' })
  response: string;

  @ApiProperty({ description: 'Conversation ID' })
  conversationId: string;

  @ApiProperty({ description: 'Message ID' })
  messageId: string;

  @ApiProperty({ description: 'Response timestamp' })
  timestamp: Date;
}

export class VerifyImageDto {
  @ApiProperty({ description: 'URL of the image to verify', example: 'https://example.com/image.jpg' })
  @IsUrl()
  imageUrl: string;

  @ApiProperty({ description: 'Mission ID for verification context' })
  @IsUUID()
  missionId: string;
}

export class ImageVerificationResponseDto {
  @ApiProperty({ description: 'Whether the image is valid for the mission' })
  isValid: boolean;

  @ApiProperty({ description: 'Confidence score (0-100)' })
  confidence: number;

  @ApiProperty({ description: 'AI reasoning for the verification decision' })
  reasoning: string;

  @ApiProperty({ type: [String], description: 'Elements detected in the image' })
  detectedElements: string[];

  @ApiPropertyOptional({ type: [String], description: 'Suggestions for improvement' })
  suggestions?: string[];

  @ApiProperty({ description: 'Unique verification ID' })
  verificationId: string;

  @ApiProperty({ description: 'Verification timestamp' })
  timestamp: Date;
}

export class GenerateEcoTipResponseDto {
  @ApiProperty({ description: 'Generated eco-friendly tip' })
  tip: string;

  @ApiProperty({ description: 'Tip category' })
  category: string;

  @ApiPropertyOptional({ description: 'User age (for age-specific tips)' })
  userAge?: number;

  @ApiPropertyOptional({ description: 'Whether this tip was retrieved from cache' })
  isCached?: boolean;

  @ApiProperty({ description: 'Generation timestamp' })
  timestamp: Date;
}

export class ConversationDto {
  @ApiProperty({ description: 'Conversation ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiPropertyOptional({ description: 'Conversation title' })
  title?: string;

  @ApiProperty({ description: 'Conversation status' })
  status: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export class ConversationListResponseDto {
  @ApiProperty({ type: [ConversationDto], description: 'List of user conversations' })
  conversations: ConversationDto[];

  @ApiProperty({ description: 'Total number of conversations' })
  total: number;
}

export class EcoEducationContentDto {
  @ApiProperty({ description: 'Topic to generate content about', example: 'renewable energy' })
  @IsString()
  topic: string;
}

export class EcoEducationContentResponseDto {
  @ApiProperty({ description: 'Generated educational content' })
  content: string;

  @ApiProperty({ description: 'Content topic' })
  topic: string;

  @ApiProperty({ description: 'Content length in words' })
  wordCount: number;

  @ApiProperty({ description: 'Generation timestamp' })
  timestamp: Date;
}

export class TrashSortingDto {
  @ApiProperty({ description: '이미지 URL', example: 'https://example.com/trash-image.jpg' })
  @IsUrl()
  imageUrl: string;
}

export class TrashSortingResponseDto {
  @ApiProperty({ description: '감지된 쓰레기 종류', example: 'plastic bottle' })
  trashType: string;

  @ApiProperty({ description: '분리수거 방법', example: '플라스틱 재활용함에 버리세요' })
  disposalMethod: string;

  @ApiProperty({ description: '국가별 세부 지침' })
  countrySpecificGuidelines: string;

  @ApiProperty({ description: '사용자 국가 코드', example: 'KR' })
  userCountry: string;

  @ApiProperty({ description: '신뢰도 점수 (0-100)', example: 85 })
  confidence: number;

  @ApiProperty({ description: '추가 팁', type: [String] })
  additionalTips: string[];

  @ApiProperty({ description: '분석 타임스탬프' })
  timestamp: Date;
}
