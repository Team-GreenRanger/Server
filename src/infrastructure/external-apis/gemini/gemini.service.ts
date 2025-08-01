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
    const systemPrompt = `You are an environmental expert and sustainability coach. 
    Generate a practical, actionable eco-friendly tip that users can implement in their daily lives. 
    The tip should be specific, easy to understand, and include the environmental impact.
    Keep it under 150 words and make it engaging.`;

    const response = await this.createChatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate a daily eco tip for me.' }
      ],
      temperature: 0.8,
      maxTokens: 200,
    });

    return response.message;
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
}
