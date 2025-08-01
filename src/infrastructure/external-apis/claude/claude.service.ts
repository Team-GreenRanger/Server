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
    this.apiKey = this.configService.get<string>('CLAUDE_API_KEY');
    if (!this.apiKey) {
      this.logger.warn('Claude API key not configured');
    }
  }

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
      
      const prompt = this.buildMissionVerificationPrompt(missionId, note);

      const payload = {
        model: 'claude-3-sonnet-20240229',
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
          'Authorization': `Bearer ${this.apiKey}`,
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

  private buildMissionVerificationPrompt(missionId: string, note?: string): string {
    const basePrompt = `You are an expert verifier for environmental missions in an eco-friendly app. 

Analyze the provided image to determine if it shows genuine completion of an environmental mission.

Look for:
- Clear evidence of eco-friendly activity (recycling, using public transport, renewable energy, etc.)
- Authentic, non-staged environmental actions
- Proper context and setting for the claimed activity
- Signs of genuine participation rather than posed photos`;
    
    const noteSection = note ? `\n\nUser's note: "${note}"\nConsider this context in your assessment.` : '';
    
    return `${basePrompt}${noteSection}

Respond with a JSON object in this exact format:
{
  "isValid": boolean,
  "confidence": number (0-100),
  "reasoning": "detailed explanation of your assessment",
  "detectedElements": ["list", "of", "detected", "elements"],
  "suggestions": ["optional", "improvement", "suggestions"]
}

Be fair but thorough. Approve genuine eco-friendly activities and reject staged or non-environmental content.`;
  }

  async verifyMissionImage(request: ImageVerificationRequest): Promise<ImageVerificationResponse> {
    if (!this.apiKey) {
      throw new Error('Claude API key not configured');
    }

    try {
      const imageBase64 = await this.fetchImageAsBase64(request.imageUrl);
      
      const prompt = this.buildVerificationPrompt(request.missionDescription, request.verificationCriteria);

      const payload = {
        model: 'claude-3-sonnet-20240229',
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
          'Authorization': `Bearer ${this.apiKey}`,
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
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return buffer.toString('base64');
    } catch (error) {
      this.logger.error('Error fetching image:', error);
      throw new Error('Failed to fetch image for verification');
    }
  }

  private buildVerificationPrompt(missionDescription: string, criteria: string[]): string {
    return `You are an expert image verification system for an environmental mission app. 
    
Mission: "${missionDescription}"

Verification Criteria:
${criteria.map((criterion, index) => `${index + 1}. ${criterion}`).join('\n')}

Please analyze the provided image and determine if it successfully demonstrates completion of this mission.

Respond with a JSON object in this exact format:
{
  "isValid": boolean,
  "confidence": number (0-100),
  "reasoning": "detailed explanation of your assessment",
  "detectedElements": ["list", "of", "detected", "elements"],
  "suggestions": ["optional", "improvement", "suggestions"]
}

Be thorough but fair in your assessment. Look for clear evidence that the mission criteria have been met.`;
  }

  private parseVerificationResponse(responseText: string): ImageVerificationResponse {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        isValid: Boolean(parsed.isValid),
        confidence: Math.min(Math.max(Number(parsed.confidence) || 0, 0), 100),
        reasoning: String(parsed.reasoning || 'No reasoning provided'),
        detectedElements: Array.isArray(parsed.detectedElements) ? parsed.detectedElements : [],
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : undefined,
      };
    } catch (error) {
      this.logger.error('Error parsing Claude response:', error);
      
      return {
        isValid: false,
        confidence: 0,
        reasoning: 'Failed to parse verification response. Please try submitting again.',
        detectedElements: [],
        suggestions: ['Please ensure the image clearly shows the mission activity'],
      };
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
        model: 'claude-3-sonnet-20240229',
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
          'Authorization': `Bearer ${this.apiKey}`,
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
