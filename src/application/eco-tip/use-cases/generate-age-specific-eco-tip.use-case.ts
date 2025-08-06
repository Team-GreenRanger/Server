import { Injectable, Inject } from '@nestjs/common';
import type { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../../../domain/user/repositories/user.repository.interface';
import { InMemoryEcoTipCacheService } from '../../../infrastructure/cache/in-memory-eco-tip-cache.service';
import { GeminiService } from '../../../infrastructure/external-apis/gemini/gemini.service';
import { ClaudeService } from '../../../infrastructure/external-apis/claude/claude.service';

export interface GenerateAgeSpecificEcoTipCommand {
  userId: string;
}

export interface GenerateAgeSpecificEcoTipResult {
  tip: string;
  category: string;
  userAge: number;
  isCached: boolean;
  timestamp: Date;
}

@Injectable()
export class GenerateAgeSpecificEcoTipUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly ecoTipCacheService: InMemoryEcoTipCacheService,
    private readonly geminiService: GeminiService,
    private readonly claudeService: ClaudeService,
  ) {}

  async execute(command: GenerateAgeSpecificEcoTipCommand): Promise<GenerateAgeSpecificEcoTipResult> {
    console.log('=== GENERATE AGE-SPECIFIC ECO TIP START ===');
    console.log('User ID:', command.userId);
    
    // 1. Get user information
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const userAge = user.age || 25; // Default to 25 years old
    console.log('User age:', userAge);
    
    // 2. Calculate current KST date
    const kstDate = this.getKSTDateString();
    console.log('KST Date:', kstDate);
    
    // 3. Check cache
    const cachedTip = await this.ecoTipCacheService.get(userAge, kstDate);
    
    if (cachedTip) {
      console.log('=== CACHED TIP FOUND ===');
      console.log('Cached tip length:', cachedTip.tipContent.length);
      
      return {
        tip: cachedTip.tipContent,
        category: cachedTip.category,
        userAge,
        isCached: true,
        timestamp: cachedTip.timestamp,
      };
    }
    
    // 4. Generate age-specific tip with AI
    console.log('=== GENERATING NEW AGE-SPECIFIC TIP ===');
    const generatedTip = await this.generateAgeSpecificTip(userAge);
    
    // 5. Cache the tip
    await this.ecoTipCacheService.set(userAge, kstDate, generatedTip, 'daily_tip');
    console.log('=== TIP CACHED SUCCESSFULLY ===');
    
    console.log('=== GENERATE AGE-SPECIFIC ECO TIP END ===');
    
    return {
      tip: generatedTip,
      category: 'daily_tip',
      userAge,
      isCached: false,
      timestamp: new Date(),
    };
  }

  private getKSTDateString(): string {
    // Convert UTC time to KST by adding 9 hours
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000; // 9 hours in milliseconds
    const kstTime = new Date(now.getTime() + kstOffset);
    
    // Extract date only (YYYY-MM-DD format)
    return kstTime.toISOString().split('T')[0];
  }

  private async generateAgeSpecificTip(userAge: number): Promise<string> {
    console.log('=== GENERATING AGE-SPECIFIC TIP ===');
    console.log('Target age:', userAge);
    
    // Age category classification
    let ageCategory = '';
    let ageSpecificGuidance = '';
    
    if (userAge <= 18) {
      ageCategory = 'teen';
      ageSpecificGuidance = `
- Activities that can be practiced at school or home
- Environmental protection activities with parents or friends
- Educational yet fun content
- Include hopeful messages about the future
- Content that can be shared on social media or told to peers`;
    } else if (userAge <= 29) {
      ageCategory = 'young adult';
      ageSpecificGuidance = `
- Activities for university students or entry-level workers
- Practical tips that don't cost much money
- Environmental protection connected to lifestyle
- Content applicable on campus or at workplace
- Methods considering both environment and economy`;
    } else if (userAge <= 49) {
      ageCategory = 'middle-aged adult';
      ageSpecificGuidance = `
- Activities that can be practiced at home with family
- Environmental protection practices in the workplace
- Environmental activities connected to children's education
- Tips linking cost savings with environmental protection
- Environmental activities through community participation`;
    } else {
      ageCategory = 'senior';
      ageSpecificGuidance = `
- Environmental protection methods using experience and wisdom
- Activities considering both health and environment
- Leaving environmental legacy for grandchildren's generation
- Environmental activities as community leaders
- Connecting traditional methods with modern environmental protection`;
    }

    const ageSpecificPrompt = `Generate a concise environmental tip for a ${userAge}-year-old person.

Age category: ${ageCategory}

Requirements:
- Maximum 2-3 sentences (under 200 characters total)
- No greetings, no motivational fluff
- Only specific, actionable advice
- Include quantifiable impact when possible
- Direct and practical

Example format: "Switch to LED bulbs. They use 75% less energy and last 25 times longer than incandescent bulbs, saving $80+ annually."

Generate only the tip without any additional text:`;

    // Try Gemini first, then Claude as backup
    try {
      console.log('=== ATTEMPTING GEMINI FOR AGE-SPECIFIC TIP ===');
      const geminiTip = await this.geminiService.generateTextContent(ageSpecificPrompt);
      console.log('Gemini age-specific tip generated');
      return geminiTip.trim();
    } catch (geminiError) {
      console.error('=== GEMINI FAILED, TRYING CLAUDE ===');
      console.error('Gemini error:', geminiError.message);
      
      try {
        console.log('=== ATTEMPTING CLAUDE FOR AGE-SPECIFIC TIP ===');
        const claudePrompt = `Generate a concise environmental tip for a ${userAge}-year-old person. Maximum 2-3 sentences, no greetings, direct advice only with quantifiable impact.`;
        const claudeTip = await this.claudeService.analyzeImageWithText('', claudePrompt);
        console.log('Claude age-specific tip generated');
        return claudeTip.trim();
      } catch (claudeError) {
        console.error('=== BOTH AI SERVICES FAILED ===');
        console.error('Claude error:', claudeError.message);
        
        // Fallback generic tip
        return this.getFallbackTip(ageCategory);
      }
    }
  }

  private getFallbackTip(ageCategory: string): string {
    const fallbackTips = {
      'teen': 'Use a reusable water bottle at school. Saves 1,460 plastic bottles annually and reduces 22kg of CO2.',
      'young adult': 'Walk or bike for trips under 2km. Saves $200+ monthly on transport and burns 300 calories per trip.',
      'middle-aged adult': 'Unplug electronics when not in use. Reduces standby power consumption by 10% and saves $120 annually.',
      'senior': 'Grow herbs in small pots indoors. Fresh basil saves $50 yearly and one plant absorbs 5kg CO2.',
    };
    
    return fallbackTips[ageCategory] || fallbackTips['middle-aged adult'];
  }
}
