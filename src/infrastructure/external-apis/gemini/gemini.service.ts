import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface GeminiChatRequest {
  contents: ChatMessage[];
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  };
}

export interface ChatCompletionRequest {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatCompletionResponse {
  message: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey: string | undefined;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  private readonly model = 'gemini-2.5-flash-lite';
  
  // Eco tip 캐시를 위한 메모리 저장소
  private ecoTipCache: { tip: string; date: string } | null = null;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!this.apiKey) {
      this.logger.warn('Gemini API key not configured');
    }
  }

  private convertMessagesToGemini(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>): ChatMessage[] {
    const geminiMessages: ChatMessage[] = [];
    let systemPrompt = '';

    // Extract system message and combine with first user message
    messages.forEach((message, index) => {
      if (message.role === 'system') {
        systemPrompt = message.content;
      } else if (message.role === 'user') {
        const content = systemPrompt && index === 1 
          ? `${systemPrompt}\n\n${message.content}` 
          : message.content;
        geminiMessages.push({
          role: 'user',
          parts: [{ text: content }]
        });
        systemPrompt = ''; // Clear after first use
      } else if (message.role === 'assistant') {
        geminiMessages.push({
          role: 'model',
          parts: [{ text: message.content }]
        });
      }
    });

    return geminiMessages;
  }

  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const geminiMessages = this.convertMessagesToGemini(request.messages);
    
    const payload: GeminiChatRequest = {
      contents: geminiMessages,
      generationConfig: {
        temperature: request.temperature || 0.7,
        maxOutputTokens: request.maxTokens || 500,
        topP: 0.8,
        topK: 10,
      },
    };

    try {
      const response = await fetch(`${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No candidates returned from Gemini API');
      }

      const candidate = data.candidates[0];
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error('No content returned from Gemini API');
      }

      return {
        message: candidate.content.parts[0].text,
        usage: data.usageMetadata ? {
          promptTokens: data.usageMetadata.promptTokenCount || 0,
          completionTokens: data.usageMetadata.candidatesTokenCount || 0,
          totalTokens: data.usageMetadata.totalTokenCount || 0,
        } : undefined,
      };
    } catch (error) {
      this.logger.error('Error calling Gemini API:', error);
      throw error;
    }
  }

  async generateEcoTip(): Promise<string> {
    // 한국 시간 기준으로 오늘 날짜 계산
    const koreaTime = new Date(new Date().getTime() + (9 * 60 * 60 * 1000));
    const today = koreaTime.toISOString().split('T')[0]; // YYYY-MM-DD 형식
    
    // 캐시된 글이 오늘 날짜와 맞는지 확인
    if (this.ecoTipCache && this.ecoTipCache.date === today) {
      this.logger.log(`Returning cached eco tip for today (${today})`);
      return this.ecoTipCache.tip;
    }
    
    this.logger.log(`Generating new eco tip for today (${today})`);
    
    const systemPrompt = `You are an environmental expert. Generate a very short, practical eco-friendly tip in exactly 2 lines.
    
    Requirements:
    - EXACTLY 2 lines separated by a line break
    - Each line maximum 50 characters (including spaces)
    - Simple, actionable advice
    - Focus on daily habits
    - Be specific and clear
    - No extra explanations or context
    - Format: First line should be the action, second line should be the benefit
    
    Examples:
    "Turn off lights when leaving rooms\nSaves 10% on your electricity bill"
    "Use a reusable water bottle daily\nPrevents 1,460 plastic bottles per year"
    "Walk for trips under 1 mile\nReduces CO2 by 0.4kg per trip"`;

    const response = await this.createChatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate a 2-line daily eco tip with specific benefits.' }
      ],
      temperature: 0.8,
      maxTokens: 80,
    });

    // 2줄 형식 보장
    let tip = response.message.trim();
    if (!tip.includes('\n')) {
      // 만약 1줄로 왔다면 적절히 나누기
      const words = tip.split(' ');
      const midPoint = Math.ceil(words.length / 2);
      tip = words.slice(0, midPoint).join(' ') + '\n' + words.slice(midPoint).join(' ');
    }

    // 캐시에 저장
    this.ecoTipCache = {
      tip,
      date: today
    };
    
    this.logger.log(`New eco tip cached: ${tip.replace('\n', ' | ')}`);
    return this.ecoTipCache.tip;
  }

  async generateMotivationalMessage(userStats: {
    completedMissions: number;
    carbonCredits: number;
    ranking: number;
  }): Promise<string> {
    const systemPrompt = `You are a motivational coach for environmental action. 
    Create encouraging messages based on user progress. Be positive, specific, and inspiring.
    Acknowledge their achievements and encourage continued action.`;

    const userMessage = `Generate a motivational message for a user with ${userStats.completedMissions} completed missions, 
    ${userStats.carbonCredits} carbon credits, and ranking #${userStats.ranking}.`;

    const response = await this.createChatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      maxTokens: 150,
    });

    return response.message;
  }

  async answerEcoQuestion(question: string, context?: string): Promise<string> {
    const systemPrompt = `You are an expert environmental scientist and climate action specialist.
    Answer questions about climate change, sustainability, environmental protection, and eco-friendly practices.
    Provide accurate, scientific information while being accessible to general audiences.
    Focus on actionable advice and practical solutions.
    ${context ? `Context: ${context}` : ''}`;

    const response = await this.createChatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question }
      ],
      temperature: 0.3,
      maxTokens: 600,
    });

    return response.message;
  }

  async analyzeTrashImage(imageUrl: string, userCountry: string, guidelines: string): Promise<string> {
    const systemPrompt = `당신은 쓰레기 분리수거 전문가입니다. 사용자가 제공한 이미지 URL을 보고 올바른 분리수거 방법을 알려주세요.

사용자 국가: ${userCountry}
해당 국가의 분리수거 규정:
${guidelines}

다음 JSON 형식으로 응답해주세요:
{
  "trashType": "감지된 쓰레기 종류 (한국어)",
  "disposalMethod": "구체적인 버리는 방법 (한국어, 50자 이내)",
  "countrySpecificGuidelines": "해당 국가의 세부 지침 (한국어, 100자 이내)",
  "confidence": 신뢰도_점수_숫자(0-100),
  "additionalTips": ["추가 팁1", "추가 팁2"]
}

중요한 규칙:
1. 반드시 JSON 형식으로만 응답
2. 한국어로 응답
3. 구체적이고 실용적인 조언 제공
4. 신뢰도는 정확한 인식 정도에 따라 설정`;

    const response = await this.createChatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `이 이미지의 쓰레기를 분석해서 어떻게 버려야 하는지 알려주세요. 이미지 URL: ${imageUrl}\n\n주의: 이미지 URL을 직접 분석할 수 없으므로, URL의 파일명이나 경로에서 힌트를 얻거나, 일반적인 쓰레기 분류 가이드를 제공해주세요.` }
      ],
      temperature: 0.3,
      maxTokens: 500,
    });

    return response.message;
  }
}
