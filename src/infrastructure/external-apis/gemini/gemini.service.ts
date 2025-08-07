import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GeminiImageVerificationResponse {
  isValid: boolean;
  confidence: number;
  reasoning: string;
  detectedElements: string[];
  suggestions?: string[];
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey: string | undefined;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  private readonly model = 'gemini-2.5-flash';

  constructor(private configService: ConfigService) {
    console.log('=== GEMINI SERVICE INITIALIZATION ===');
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY');
    console.log('Config service available:', !!this.configService);
    console.log('GEMINI_API_KEY from config:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'NOT SET');
    console.log('API Key length:', this.apiKey?.length || 0);
    console.log('Base URL:', this.baseUrl);
    console.log('Model:', this.model);
    
    if (!this.apiKey) {
      console.warn('WARNING: Gemini API key not configured - all verifications will fail');
      this.logger.warn('Gemini API key not configured');
    } else {
      console.log('Gemini API key configured successfully');
    }
    console.log('=== GEMINI SERVICE READY ===');
  }

  async verifyMissionWithDetails(
    missionTitle: string,
    missionDescription: string,
    verificationCriteria: string[],
    imageUrls: string[],
    note?: string
  ): Promise<GeminiImageVerificationResponse> {
    console.log('=== GEMINI VERIFICATION START ===');
    console.log('Mission Title:', missionTitle);
    console.log('Mission Description:', missionDescription);
    console.log('Verification Criteria:', verificationCriteria);
    console.log('Image URLs:', imageUrls);
    console.log('Note:', note);
    console.log('API Key available:', !!this.apiKey);
    console.log('API Key first 10 chars:', this.apiKey?.substring(0, 10));
    
    if (!this.apiKey) {
      console.error('CRITICAL: Gemini API key not configured');
      throw new Error('Gemini API key not configured');
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

Analyze the provided image to determine if it successfully demonstrates completion of this mission.

${note ? `User's note: "${note}"\nConsider this context in your assessment.\n` : ''}
Look for:
- Clear evidence that matches AT LEAST ONE of the mission requirements
- Authentic environmental actions that align with the mission purpose
- Proper context and setting for the claimed activity
- Logical consistency between the mission goal and what's shown in the image

Approval Guidelines:
✅ APPROVE if you can clearly identify ANY ONE verification criterion being met
✅ APPROVE if the image shows genuine environmental effort that matches the mission intent
✅ APPROVE if the context and user note support a valid environmental claim
❌ REJECT if the image shows the OPPOSITE of what the mission requires
❌ REJECT if clearly fake, staged, or completely unrelated to the mission
❌ REJECT if there's a logical contradiction between mission goal and image content

⚠️ CRITICAL: Pay special attention to logical inconsistencies. For example:
- If the mission is about "unplugging devices to save energy" but the image shows plugged-in devices, REJECT it
- If the mission is about "using reusable bags" but the image shows single-use plastic bags, REJECT it
- If the mission is about "turning off lights" but the image shows lights turned on, REJECT it
(EX: 이렇게 미션의 목적과 정반대되는 로직이 잘못된 경우에는 반드시 거절하세요)

Be fair but accurate in your assessment. Encourage genuine environmental action while maintaining verification integrity.

Respond with a JSON object in this exact format:
{
  "isValid": true/false,
  "confidence": (number from 0-100),
  "reasoning": "detailed explanation of your assessment",
  "detectedElements": ["list", "of", "detected", "elements"],
  "suggestions": ["optional", "improvement", "suggestions"]
}

Ensure logical consistency between the mission requirements and the image evidence.`;

      console.log('Gemini prompt length:', prompt.length);
      console.log('Gemini prompt preview (first 200 chars):', prompt.substring(0, 200));

      const payload = {
        contents: [{
          parts: [
            {
              text: prompt
            },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: imageBase64
              }
            }
          ]
        }]
      };

      console.log('Gemini API payload structure:');
      console.log('- Contents count:', payload.contents.length);
      console.log('- Parts count:', payload.contents[0].parts.length);
      console.log('- Text content length:', payload.contents[0].parts[0].text?.length);
      console.log('- Image data length:', payload.contents[0].parts[1].inline_data?.data.length);

      const requestUrl = `${this.baseUrl}/${this.model}:generateContent`;
      console.log('Making request to Gemini API:', requestUrl);
      
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      console.log('Gemini API response status:', response.status);
      console.log('Gemini API response statusText:', response.statusText);
      console.log('Gemini API response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Gemini API ERROR RESPONSE:', errorData);
        console.error('Full error details:', JSON.stringify(errorData, null, 2));
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log('Gemini API SUCCESS RESPONSE:');
      console.log('- Response keys:', Object.keys(data));
      console.log('- Candidates available:', !!data.candidates);
      console.log('- Candidates length:', data.candidates?.length);
      console.log('- Full response:', JSON.stringify(data, null, 2));
      
      if (!data.candidates || data.candidates.length === 0) {
        console.error('CRITICAL: No candidates returned from Gemini API');
        throw new Error('No candidates returned from Gemini API');
      }

      const candidate = data.candidates[0];
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        console.error('CRITICAL: No content parts in candidate');
        throw new Error('No content parts in candidate');
      }

      const responseText = candidate.content.parts[0].text;
      console.log('Gemini response text:', responseText);
      
      const parsedResult = this.parseVerificationResponse(responseText);
      console.log('Parsed verification result:', parsedResult);
      console.log('=== GEMINI VERIFICATION SUCCESS ===');
      
      return parsedResult;
    } catch (error) {
      console.error('=== GEMINI VERIFICATION ERROR ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error object:', error);
      this.logger.error('Error verifying mission with Gemini:', error);
      
      throw new Error('Gemini verification failed: ' + error.message);
    }
  }

  private async fetchImageAsBase64(imageUrl: string): Promise<string> {
    console.log('=== FETCHING IMAGE AS BASE64 (GEMINI) ===');
    console.log('Image URL:', imageUrl);
    console.log('URL type:', typeof imageUrl);
    console.log('URL length:', imageUrl?.length);
    
    try {
      console.log('Making fetch request to:', imageUrl);
      const response = await fetch(imageUrl);
      
      console.log('Fetch response status:', response.status);
      console.log('Fetch response statusText:', response.statusText);
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
      console.log('=== IMAGE FETCH SUCCESS (GEMINI) ===');
      
      return base64String;
    } catch (error) {
      console.error('=== IMAGE FETCH ERROR (GEMINI) ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error object:', error);
      this.logger.error('Error fetching image for Gemini:', error);
      throw new Error('Failed to fetch image for Gemini verification');
    }
  }

  private parseVerificationResponse(responseText: string): GeminiImageVerificationResponse {
    console.log('=== PARSING GEMINI VERIFICATION RESPONSE ===');
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
      
      console.log('Final processed result (Gemini):', result);
      console.log('=== GEMINI PARSING SUCCESS ===');
      return result;
    } catch (error) {
      console.error('=== GEMINI PARSING ERROR ===');
      console.error('Parse error type:', error.constructor.name);
      console.error('Parse error message:', error.message);
      console.error('Parse error stack:', error.stack);
      this.logger.error('Error parsing Gemini response:', error);
      
      const fallbackResult = {
        isValid: false,
        confidence: 0,
        reasoning: 'Failed to parse Gemini verification response. Please try submitting again.',
        detectedElements: [],
        suggestions: ['Please ensure the image clearly shows the mission activity'],
      };
      
      console.log('Returning fallback result (Gemini):', fallbackResult);
      return fallbackResult;
    }
  }

  async generateEcoTip(): Promise<string> {
    console.log('=== GEMINI ECO TIP GENERATION START ===');
    
    if (!this.apiKey) {
      console.error('CRITICAL: Gemini API key not configured');
      throw new Error('Gemini API key not configured');
    }

    try {
      const ecoTipPrompt = `Generate a practical, actionable environmental tip for today. Make it:

- Specific and easy to implement
- Suitable for everyday life
- Scientifically accurate
- About 50-100 words
- Include a specific action people can take
- Focus on real environmental impact

Provide just the tip without additional formatting or explanations.`;
      
      const payload = {
        contents: [{
          parts: [{
            text: ecoTipPrompt
          }]
        }]
      };

      const requestUrl = `${this.baseUrl}/${this.model}:generateContent`;
      console.log('Making request to Gemini API for eco tip generation...');
      
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      console.log('Gemini API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Gemini API ERROR RESPONSE:', errorData);
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log('Gemini API SUCCESS RESPONSE for eco tip');
      
      if (!data.candidates || data.candidates.length === 0) {
        console.error('CRITICAL: No candidates returned from Gemini API');
        throw new Error('No candidates returned from Gemini API');
      }

      const candidate = data.candidates[0];
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        console.error('CRITICAL: No content parts in candidate');
        throw new Error('No content parts in candidate');
      }

      const ecoTip = candidate.content.parts[0].text;
      console.log('Generated eco tip length:', ecoTip.length);
      console.log('=== GEMINI ECO TIP GENERATION SUCCESS ===');
      
      return ecoTip.trim();
    } catch (error) {
      console.error('=== GEMINI ECO TIP GENERATION ERROR ===');
      console.error('Error:', error);
      this.logger.error('Error generating eco tip (Gemini):', error);
      throw error;
    }
  }

  async generateEcoEducationContent(topic: string): Promise<string> {
    console.log('=== GEMINI ECO EDUCATION CONTENT GENERATION START ===');
    console.log('Topic:', topic);
    
    if (!this.apiKey) {
      console.error('CRITICAL: Gemini API key not configured');
      throw new Error('Gemini API key not configured');
    }

    try {
      const educationPrompt = `You are an environmental education expert. Create engaging, accurate educational content about: "${topic}"

Make it:
- Scientifically accurate
- Easy to understand for general audiences
- Actionable with practical tips
- About 200-300 words
- Include specific examples and statistics where relevant

Provide the educational content without additional formatting.`;
      
      const payload = {
        contents: [{
          parts: [{
            text: educationPrompt
          }]
        }]
      };

      const requestUrl = `${this.baseUrl}/${this.model}:generateContent`;
      console.log('Making request to Gemini API for education content...');
      
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      console.log('Gemini API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Gemini API ERROR RESPONSE:', errorData);
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log('Gemini API SUCCESS RESPONSE for education content');
      
      if (!data.candidates || data.candidates.length === 0) {
        console.error('CRITICAL: No candidates returned from Gemini API');
        throw new Error('No candidates returned from Gemini API');
      }

      const candidate = data.candidates[0];
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        console.error('CRITICAL: No content parts in candidate');
        throw new Error('No content parts in candidate');
      }

      const educationContent = candidate.content.parts[0].text;
      console.log('Generated education content length:', educationContent.length);
      console.log('=== GEMINI ECO EDUCATION CONTENT GENERATION SUCCESS ===');
      
      return educationContent.trim();
    } catch (error) {
      console.error('=== GEMINI ECO EDUCATION CONTENT GENERATION ERROR ===');
      console.error('Error:', error);
      this.logger.error('Error generating eco education content (Gemini):', error);
      throw error;
    }
  }

  async createChatCompletion(options: {
    messages: Array<{role: 'system' | 'user' | 'assistant', content: string}>;
    temperature?: number;
    maxTokens?: number;
  }): Promise<{message: string}> {
    console.log('=== GEMINI CHAT COMPLETION START ===');
    console.log('Messages count:', options.messages.length);
    console.log('Temperature:', options.temperature);
    console.log('Max tokens:', options.maxTokens);
    
    if (!this.apiKey) {
      console.error('CRITICAL: Gemini API key not configured');
      throw new Error('Gemini API key not configured');
    }

    try {
      // Gemini는 시스템 메시지를 별도로 처리하지 않으므로 대화 형식으로 변환
      const systemMessage = options.messages.find(m => m.role === 'system');
      const conversationMessages = options.messages.filter(m => m.role !== 'system');
      
      let prompt = '';
      if (systemMessage) {
        prompt += `${systemMessage.content}\n\nConversation:\n`;
      }
      
      for (const msg of conversationMessages) {
        if (msg.role === 'user') {
          prompt += `Human: ${msg.content}\n`;
        } else if (msg.role === 'assistant') {
          prompt += `Assistant: ${msg.content}\n`;
        }
      }
      
      prompt += 'Assistant:';
      
      console.log('Generated prompt length:', prompt.length);
      console.log('Generated prompt preview:', prompt.substring(0, 300));
      
      const payload = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      };

      const requestUrl = `${this.baseUrl}/${this.model}:generateContent`;
      console.log('Making request to Gemini API for chat completion...');
      
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      console.log('Gemini API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Gemini API ERROR RESPONSE:', errorData);
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log('Gemini API SUCCESS RESPONSE for chat');
      
      if (!data.candidates || data.candidates.length === 0) {
        console.error('CRITICAL: No candidates returned from Gemini API');
        throw new Error('No candidates returned from Gemini API');
      }

      const candidate = data.candidates[0];
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        console.error('CRITICAL: No content parts in candidate');
        throw new Error('No content parts in candidate');
      }

      const aiMessage = candidate.content.parts[0].text;
      console.log('Generated AI message length:', aiMessage.length);
      console.log('=== GEMINI CHAT COMPLETION SUCCESS ===');
      
      return { message: aiMessage.trim() };
    } catch (error) {
      console.error('=== GEMINI CHAT COMPLETION ERROR ===');
      console.error('Error:', error);
      this.logger.error('Error creating chat completion (Gemini):', error);
      throw error;
    }
  }

  async generateTextContent(prompt: string): Promise<string> {
    console.log('=== GEMINI TEXT CONTENT GENERATION START ===');
    console.log('Prompt length:', prompt.length);
    
    if (!this.apiKey) {
      console.error('CRITICAL: Gemini API key not configured');
      throw new Error('Gemini API key not configured');
    }

    try {
      const payload = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      };

      const requestUrl = `${this.baseUrl}/${this.model}:generateContent`;
      console.log('Making request to Gemini API for text content generation...');
      
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      console.log('Gemini API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Gemini API ERROR RESPONSE:', errorData);
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log('Gemini API SUCCESS RESPONSE for text content');
      
      if (!data.candidates || data.candidates.length === 0) {
        console.error('CRITICAL: No candidates returned from Gemini API');
        throw new Error('No candidates returned from Gemini API');
      }

      const candidate = data.candidates[0];
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        console.error('CRITICAL: No content parts in candidate');
        throw new Error('No content parts in candidate');
      }

      const textContent = candidate.content.parts[0].text;
      console.log('Generated text content length:', textContent.length);
      console.log('=== GEMINI TEXT CONTENT GENERATION SUCCESS ===');
      
      return textContent.trim();
    } catch (error) {
      console.error('=== GEMINI TEXT CONTENT GENERATION ERROR ===');
      console.error('Error:', error);
      this.logger.error('Error generating text content (Gemini):', error);
      throw error;
    }
  }

  async analyzeImageWithText(imageUrl: string, analysisPrompt: string): Promise<string> {
    console.log('=== GEMINI IMAGE TEXT ANALYSIS START ===');
    console.log('Image URL:', imageUrl);
    console.log('Analysis prompt length:', analysisPrompt.length);
    
    if (!this.apiKey) {
      console.error('CRITICAL: Gemini API key not configured');
      throw new Error('Gemini API key not configured');
    }

    try {
      console.log('Fetching image as base64...');
      const imageBase64 = await this.fetchImageAsBase64(imageUrl);
      console.log('Image fetched successfully, base64 length:', imageBase64.length);
      
      const payload = {
        contents: [{
          parts: [
            {
              text: analysisPrompt
            },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: imageBase64
              }
            }
          ]
        }]
      };

      const requestUrl = `${this.baseUrl}/${this.model}:generateContent`;
      console.log('Making request to Gemini API for image text analysis...');
      
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      console.log('Gemini API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Gemini API ERROR RESPONSE:', errorData);
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log('Gemini API SUCCESS RESPONSE');
      
      if (!data.candidates || data.candidates.length === 0) {
        console.error('CRITICAL: No candidates returned from Gemini API');
        throw new Error('No candidates returned from Gemini API');
      }

      const candidate = data.candidates[0];
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        console.error('CRITICAL: No content parts in candidate');
        throw new Error('No content parts in candidate');
      }

      const responseText = candidate.content.parts[0].text;
      console.log('Gemini response text length:', responseText.length);
      console.log('=== GEMINI IMAGE TEXT ANALYSIS SUCCESS ===');
      
      return responseText;
    } catch (error) {
      console.error('=== GEMINI IMAGE TEXT ANALYSIS ERROR ===');
      console.error('Error:', error);
      this.logger.error('Error analyzing image with text (Gemini):', error);
      throw error;
    }
  }
}
