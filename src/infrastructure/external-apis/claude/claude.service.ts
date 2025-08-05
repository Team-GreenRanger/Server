import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ImageVerificationRequest {
  imageUrl: string;
  missionDescription: string;
  verificationCriteria: string[];
}

export interface ImageVerificationResponse {
  isValid: boolean;
  confidence: number; // 0-100
  reasoning: string;
  detectedElements: string[];
  suggestions?: string[];
}

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: Array<{
    type: 'text' | 'image';
    text?: string;
    source?: {
      type: 'base64';
      media_type: string;
      data: string;
    };
  }>;
}

@Injectable()
export class ClaudeService {
  private readonly logger = new Logger(ClaudeService.name);
  private readonly apiKey: string | undefined;
  private readonly baseUrl = 'https://api.anthropic.com/v1';

  constructor(private configService: ConfigService) {
    console.log('=== CLAUDE SERVICE INITIALIZATION ===');
    this.apiKey = this.configService.get<string>('CLAUDE_API_KEY');
    console.log('Config service available:', !!this.configService);
    console.log('CLAUDE_API_KEY from config:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'NOT SET');
    console.log('API Key length:', this.apiKey?.length || 0);
    console.log('Base URL:', this.baseUrl);
    
    if (!this.apiKey) {
      console.warn('WARNING: Claude API key not configured - all verifications will fail');
      this.logger.warn('Claude API key not configured');
    } else {
      console.log('Claude API key configured successfully');
    }
    console.log('=== CLAUDE SERVICE READY ===');
  }

  // 실제 미션 정보를 사용한 검증 메서드 (새로운 버전)
  async verifyMissionWithDetails(
    missionTitle: string,
    missionDescription: string,
    verificationCriteria: string[],
    imageUrls: string[],
    note?: string
  ): Promise<ImageVerificationResponse> {
    console.log('=== CLAUDE VERIFICATION START ===');
    console.log('Mission Title:', missionTitle);
    console.log('Mission Description:', missionDescription);
    console.log('Verification Criteria:', verificationCriteria);
    console.log('Image URLs:', imageUrls);
    console.log('Note:', note);
    console.log('API Key available:', !!this.apiKey);
    console.log('API Key first 10 chars:', this.apiKey?.substring(0, 10));
    
    if (!this.apiKey) {
      console.error('CRITICAL: Claude API key not configured');
      throw new Error('Claude API key not configured');
    }

    if (!imageUrls || imageUrls.length === 0) {
      console.error('CRITICAL: No images provided');
      return {
        isValid: false,
        confidence: 0,
        reasoning: 'No images provided for verification',
        detectedElements: [],
        suggestions: ['Please provide at least one image as evidence'],
      };
    }

    try {
      const primaryImageUrl = imageUrls[0];
      console.log('Processing primary image URL:', primaryImageUrl);
      
      console.log('Fetching image as base64...');
      const imageBase64 = await this.fetchImageAsBase64(primaryImageUrl);
      console.log('Image base64 length:', imageBase64.length);
      console.log('Image base64 first 50 chars:', imageBase64.substring(0, 50));
      
      const prompt = `You are an expert verifier for environmental missions in an eco-friendly app.

Mission: "${missionTitle}"
Description: ${missionDescription}

Verification Criteria (Any ONE of these criteria being met is sufficient for approval):
${verificationCriteria.map((criterion, index) => `${index + 1}. ${criterion}`).join('\n')}

⚠️ IMPORTANT: This mission should be APPROVED if the image shows ANY ONE of the above criteria being met. You don't need to see ALL criteria - just ONE is enough for approval.

Analyze the provided image to determine if it successfully demonstrates completion of this mission.

${note ? `User's note: "${note}"\nConsider this context in your assessment.\n` : ''}
Look for:
- Clear evidence that matches AT LEAST ONE of the mission requirements (not all of them)
- Authentic, non-staged environmental actions
- Proper context and setting for the claimed activity
- Evidence that ANY ONE of the verification criteria is met

Approval Guidelines:
✅ APPROVE if you can identify ANY ONE verification criterion being met
✅ APPROVE if the image shows genuine environmental effort, even if not perfect
✅ APPROVE if the context and user note support the environmental claim
❌ REJECT only if clearly fake, staged, or completely unrelated to environmental activity

Be GENEROUS and SUPPORTIVE in your assessment. The goal is to encourage environmental action, not to be overly strict.

Respond with a JSON object in this exact format:
{
  "isValid": boolean,
  "confidence": number (0-100),
  "reasoning": "detailed explanation of your assessment",
  "detectedElements": ["list", "of", "detected", "elements"],
  "suggestions": ["optional", "improvement", "suggestions"]
}

Be encouraging and fair in your assessment. Approve genuine eco-friendly activities that meet ANY ONE of the criteria.`;

      console.log('Claude prompt length:', prompt.length);
      console.log('Claude prompt preview (first 200 chars):', prompt.substring(0, 200));

      const payload = {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: imageBase64
                }
              }
            ]
          }
        ]
      };

      console.log('Claude API payload structure:');
      console.log('- Model:', payload.model);
      console.log('- Max tokens:', payload.max_tokens);
      console.log('- Messages count:', payload.messages.length);
      console.log('- Content items:', payload.messages[0].content.length);
      console.log('- Text content length:', payload.messages[0].content[0].text?.length);
      console.log('- Image data length:', payload.messages[0].content[1].source?.data.length);

      console.log('Making request to Claude API:', `${this.baseUrl}/messages`);
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(payload),
      });

      console.log('Claude API response status:', response.status);
      console.log('Claude API response statusText:', response.statusText);
      console.log('Claude API response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Claude API ERROR RESPONSE:', errorData);
        console.error('Full error details:', JSON.stringify(errorData, null, 2));
        throw new Error(`Claude API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log('Claude API SUCCESS RESPONSE:');
      console.log('- Response keys:', Object.keys(data));
      console.log('- Content available:', !!data.content);
      console.log('- Content length:', data.content?.length);
      console.log('- First content type:', data.content?.[0]?.type);
      console.log('- Response text length:', data.content?.[0]?.text?.length);
      console.log('- Full response:', JSON.stringify(data, null, 2));
      
      if (!data.content || data.content.length === 0) {
        console.error('CRITICAL: No content returned from Claude API');
        throw new Error('No content returned from Claude API');
      }

      const responseText = data.content[0].text;
      console.log('Claude response text:', responseText);
      
      const parsedResult = this.parseVerificationResponse(responseText);
      console.log('Parsed verification result:', parsedResult);
      console.log('=== CLAUDE VERIFICATION SUCCESS ===');
      
      return parsedResult;
    } catch (error) {
      console.error('=== CLAUDE VERIFICATION ERROR ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error object:', error);
      this.logger.error('Error verifying mission with details:', error);
      
      return {
        isValid: false,
        confidence: 0,
        reasoning: 'Automatic verification failed. Manual review required.',
        detectedElements: [],
        suggestions: ['Please ensure images are clear and show the mission activity clearly'],
      };
    }
  }

  // 기존 검증 메서드 (하위 호환성 유지)
  async verifyMissionEvidence(
    missionId: string,
    imageUrls: string[],
    note?: string
  ): Promise<ImageVerificationResponse> {
    if (!this.apiKey) {
      throw new Error('Claude API key not configured');
    }

    if (!imageUrls || imageUrls.length === 0) {
      return {
        isValid: false,
        confidence: 0,
        reasoning: 'No images provided for verification',
        detectedElements: [],
        suggestions: ['Please provide at least one image as evidence'],
      };
    }

    try {
      const primaryImageUrl = imageUrls[0];
      const imageBase64 = await this.fetchImageAsBase64(primaryImageUrl);
      
      const prompt = `You are an expert verifier for environmental missions in an eco-friendly app.

Analyze the provided image to determine if it shows genuine completion of an environmental mission.

Mission ID: ${missionId}

⚠️ IMPORTANT: Be GENEROUS and SUPPORTIVE in your assessment. The goal is to encourage environmental action.

Look for:
- ANY evidence of eco-friendly activity (recycling, using public transport, renewable energy, etc.)
- Authentic environmental actions (even if not perfect)
- Proper context and setting for the claimed activity
- Signs of genuine participation rather than completely staged photos

${note ? `User's note: "${note}"\nConsider this context in your assessment and give extra credit for user effort.` : ''}

Approval Guidelines:
✅ APPROVE if you can see ANY genuine environmental effort
✅ APPROVE if the context suggests real environmental action
✅ APPROVE if the user note explains the environmental benefit
❌ REJECT only if clearly fake, staged, or completely unrelated to environment

Respond with a JSON object in this exact format:
{
  "isValid": boolean,
  "confidence": number (0-100),
  "reasoning": "detailed explanation of your assessment",
  "detectedElements": ["list", "of", "detected", "elements"],
  "suggestions": ["optional", "improvement", "suggestions"]
}

Be encouraging and fair. Approve genuine eco-friendly activities even if they're not perfect.`;

      const payload = {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: imageBase64
                }
              }
            ]
          }
        ]
      };

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Claude API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      if (!data.content || data.content.length === 0) {
        throw new Error('No content returned from Claude API');
      }

      return this.parseVerificationResponse(data.content[0].text);
    } catch (error) {
      this.logger.error('Error verifying mission evidence:', error);
      
      return {
        isValid: false,
        confidence: 0,
        reasoning: 'Automatic verification failed. Manual review required.',
        detectedElements: [],
        suggestions: ['Please ensure images are clear and show the mission activity clearly'],
      };
    }
  }

  async verifyMissionImage(request: ImageVerificationRequest): Promise<ImageVerificationResponse> {
    if (!this.apiKey) {
      throw new Error('Claude API key not configured');
    }

    try {
      const imageBase64 = await this.fetchImageAsBase64(request.imageUrl);
      
      const prompt = this.buildVerificationPrompt(request.missionDescription, request.verificationCriteria);

      const payload = {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: imageBase64
                }
              }
            ]
          }
        ]
      };

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Claude API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      if (!data.content || data.content.length === 0) {
        throw new Error('No content returned from Claude API');
      }

      return this.parseVerificationResponse(data.content[0].text);
    } catch (error) {
      this.logger.error('Error calling Claude API:', error);
      throw error;
    }
  }

  private async fetchImageAsBase64(imageUrl: string): Promise<string> {
    console.log('=== FETCHING IMAGE AS BASE64 ===');
    console.log('Image URL:', imageUrl);
    console.log('URL type:', typeof imageUrl);
    console.log('URL length:', imageUrl?.length);
    
    try {
      console.log('Making fetch request to:', imageUrl);
      const response = await fetch(imageUrl);
      
      console.log('Fetch response status:', response.status);
      console.log('Fetch response statusText:', response.statusText);
      console.log('Fetch response headers:', Object.fromEntries(response.headers.entries()));
      console.log('Fetch response ok:', response.ok);
      console.log('Fetch response url:', response.url);
      
      if (!response.ok) {
        console.error('Fetch failed with status:', response.status, response.statusText);
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      console.log('Converting response to arrayBuffer...');
      const arrayBuffer = await response.arrayBuffer();
      console.log('ArrayBuffer size:', arrayBuffer.byteLength, 'bytes');
      
      console.log('Converting arrayBuffer to Buffer...');
      const buffer = Buffer.from(arrayBuffer);
      console.log('Buffer size:', buffer.length, 'bytes');
      
      console.log('Converting buffer to base64...');
      const base64String = buffer.toString('base64');
      console.log('Base64 string length:', base64String.length);
      console.log('Base64 first 100 chars:', base64String.substring(0, 100));
      console.log('=== IMAGE FETCH SUCCESS ===');
      
      return base64String;
    } catch (error) {
      console.error('=== IMAGE FETCH ERROR ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error object:', error);
      this.logger.error('Error fetching image:', error);
      throw new Error('Failed to fetch image for verification');
    }
  }

  private buildVerificationPrompt(missionDescription: string, criteria: string[]): string {
    return `You are an expert image verification system for an environmental mission app. 
    
Mission: "${missionDescription}"

Verification Criteria (Any ONE of these criteria being met is sufficient for approval):
${criteria.map((criterion, index) => `${index + 1}. ${criterion}`).join('\n')}

⚠️ IMPORTANT: This mission should be APPROVED if the image shows ANY ONE of the above criteria being met. You don't need to see ALL criteria - just ONE is enough for approval.

Please analyze the provided image and determine if it successfully demonstrates completion of this mission.

Approval Guidelines:
✅ APPROVE if you can identify ANY ONE verification criterion being met
✅ APPROVE if the image shows genuine environmental effort, even if not perfect
❌ REJECT only if clearly fake, staged, or completely unrelated to environmental activity

Be GENEROUS and SUPPORTIVE in your assessment. The goal is to encourage environmental action, not to be overly strict.

Respond with a JSON object in this exact format:
{
  "isValid": boolean,
  "confidence": number (0-100),
  "reasoning": "detailed explanation of your assessment",
  "detectedElements": ["list", "of", "detected", "elements"],
  "suggestions": ["optional", "improvement", "suggestions"]
}

Be encouraging and fair in your assessment. Look for clear evidence that ANY ONE of the mission criteria has been met.`;
  }

  private parseVerificationResponse(responseText: string): ImageVerificationResponse {
    console.log('=== PARSING VERIFICATION RESPONSE ===');
    console.log('Response text length:', responseText?.length);
    console.log('Response text:', responseText);
    
    try {
      console.log('Looking for JSON in response text...');
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      console.log('JSON match found:', !!jsonMatch);
      
      if (!jsonMatch) {
        console.error('No JSON found in response text');
        throw new Error('No JSON found in response');
      }

      const jsonString = jsonMatch[0];
      console.log('Extracted JSON string:', jsonString);
      console.log('JSON string length:', jsonString.length);
      
      console.log('Parsing JSON...');
      const parsed = JSON.parse(jsonString);
      console.log('Parsed JSON object:', parsed);
      console.log('Parsed object keys:', Object.keys(parsed));
      console.log('isValid:', parsed.isValid, typeof parsed.isValid);
      console.log('confidence:', parsed.confidence, typeof parsed.confidence);
      console.log('reasoning:', parsed.reasoning?.substring(0, 100));
      console.log('detectedElements:', parsed.detectedElements);
      console.log('suggestions:', parsed.suggestions);
      
      const result = {
        isValid: Boolean(parsed.isValid),
        confidence: Math.min(Math.max(Number(parsed.confidence) || 0, 0), 100),
        reasoning: String(parsed.reasoning || 'No reasoning provided'),
        detectedElements: Array.isArray(parsed.detectedElements) ? parsed.detectedElements : [],
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : undefined,
      };
      
      console.log('Final processed result:', result);
      console.log('=== PARSING SUCCESS ===');
      return result;
    } catch (error) {
      console.error('=== PARSING ERROR ===');
      console.error('Parse error type:', error.constructor.name);
      console.error('Parse error message:', error.message);
      console.error('Parse error stack:', error.stack);
      this.logger.error('Error parsing Claude response:', error);
      
      const fallbackResult = {
        isValid: false,
        confidence: 0,
        reasoning: 'Failed to parse verification response. Please try submitting again.',
        detectedElements: [],
        suggestions: ['Please ensure the image clearly shows the mission activity'],
      };
      
      console.log('Returning fallback result:', fallbackResult);
      return fallbackResult;
    }
  }

  async generateEcoEducationContent(topic: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Claude API key not configured');
    }

    const prompt = `You are an environmental education expert. Create engaging, accurate educational content about: "${topic}"

Make it:
- Scientifically accurate
- Easy to understand for general audiences
- Actionable with practical tips
- About 200-300 words
- Include specific examples and statistics where relevant`;

    try {
      const payload = {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      };

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      this.logger.error('Error generating education content:', error);
      throw error;
    }
  }
}