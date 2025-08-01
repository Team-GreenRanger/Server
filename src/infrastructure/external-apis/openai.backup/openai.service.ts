import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
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
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly apiKey: string | undefined;
  private readonly baseUrl = 'https://api.openai.com/v1';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!this.apiKey) {
      this.logger.warn('OpenAI API key not configured');
    }
  }

  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const payload = {
      model: request.model || 'gpt-3.5-turbo',
      messages: request.messages,
      temperature: request.temperature || 0.7,
      max_tokens: request.maxTokens || 500,
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No choices returned from OpenAI API');
      }

      return {
        message: data.choices[0].message.content,
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        } : undefined,
      };
    } catch (error) {
      this.logger.error('Error calling OpenAI API:', error);
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
