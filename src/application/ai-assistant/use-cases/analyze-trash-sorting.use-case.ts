import { Injectable, Inject } from '@nestjs/common';
import type { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../../../domain/user/repositories/user.repository.interface';
import { ClaudeService } from '../../../infrastructure/external-apis/claude/claude.service';
import { GeminiService } from '../../../infrastructure/external-apis/gemini/gemini.service';

export interface TrashSortingRequest {
  userId: string;
  imageUrl: string;
}

export interface TrashSortingResult {
  trashType: string;
  disposalMethod: string;
  countrySpecificGuidelines: string;
  userCountry: string;
  confidence: number;
  additionalTips: string[];
  timestamp: Date;
}

@Injectable()
export class AnalyzeTrashSortingUseCase {
  constructor(
      @Inject(USER_REPOSITORY)
      private readonly userRepository: IUserRepository,
      private readonly claudeService: ClaudeService,
      private readonly geminiService: GeminiService,
  ) {}

  async execute(request: TrashSortingRequest): Promise<TrashSortingResult> {
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const userCountry = user.nationality || 'KR';
    const countryGuidelines = this.getCountrySpecificGuidelines(userCountry);
    const analysis = await this.analyzeTrashWithAI(request.imageUrl, userCountry, countryGuidelines);

    return {
      trashType: analysis.trashType,
      disposalMethod: analysis.disposalMethod,
      countrySpecificGuidelines: analysis.countrySpecificGuidelines,
      userCountry,
      confidence: analysis.confidence,
      additionalTips: analysis.additionalTips,
      timestamp: new Date(),
    };
  }

  private getCountrySpecificGuidelines(countryCode: string): string {
    const guidelines = {
      'KR': `Korea Waste Separation Rules:
      - Plastic: Empty contents, remove labels, put in plastic recycling bin
      - Paper: Remove tape and staples, put in paper recycling bin  
      - Cans/Metal: Empty contents, put in can recycling bin
      - Glass: Remove caps, put in glass recycling bin
      - General waste: Use designated waste bags
      - Food waste: Remove moisture, put in food waste bin`,

      'US': `US Recycling Guidelines:
      - Plastic: Remove caps, rinse containers, check recycling number
      - Paper: Remove staples, separate by type (cardboard, mixed paper)
      - Metal: Rinse cans and containers
      - Glass: Remove lids, separate by color in some areas
      - General waste: Regular trash bags
      - Organic waste: Compost bins where available`,

      'JP': `Japan Waste Separation Rules:
      - Plastic: Empty and clean containers, check plastic recycling mark
      - Paper: Remove staples, put in recyclable waste
      - Cans: Empty contents, put in can/bottle/PET bottle collection
      - Food waste: Put in burnable waste on designated days
      - Non-burnable waste: Put out on designated collection days`,

      'DE': `German Waste Separation:
      - Yellow bag: Plastic and metal packaging
      - Paper bin: Newspapers, cardboard (without tape)
      - Glass container: Separated by color
      - Bio bin: Organic waste
      - Residual waste: Non-recyclable materials`,
    };

    return guidelines[countryCode] || guidelines['KR'];
  }

  private async analyzeTrashWithAI(imageUrl: string, userCountry: string, guidelines: string): Promise<{
    trashType: string;
    disposalMethod: string;
    countrySpecificGuidelines: string;
    confidence: number;
    additionalTips: string[];
  }> {
    console.log('=== TRASH ANALYSIS START ===');
    console.log('Image URL:', imageUrl);
    console.log('User Country:', userCountry);
    
    const analysisPrompt = `Analyze the waste item in this image and provide disposal instructions.

User's country: ${userCountry}
Country-specific waste separation regulations:
${guidelines}

CRITICAL INSTRUCTIONS:
1. Respond ONLY with valid JSON
2. Do not include any text before or after the JSON
3. Do not use markdown code blocks or backticks
4. Ensure all string values are properly escaped

Required JSON format:
{
  "trashType": "specific item name (e.g., plastic bottle, cardboard box, aluminum can)",
  "disposalMethod": "step-by-step disposal instructions",
  "countrySpecificGuidelines": "country-specific regulations for this item",
  "confidence": number_between_0_and_100,
  "additionalTips": ["tip1", "tip2"]
}

Requirements:
- Identify the specific waste item visible in the image
- Follow the waste separation rules for ${userCountry}
- Provide practical disposal instructions
- If uncertain about identification, lower the confidence score
- All responses must be in English`;

    // Try Claude first
    try {
      console.log('=== ATTEMPTING CLAUDE TRASH ANALYSIS ===');
      const claudeResponse = await this.claudeService.analyzeImageWithText(imageUrl, analysisPrompt);
      console.log('Claude response received for trash analysis');
      
      let analysisResult;
      try {
        const cleanedResponse = this.extractAndCleanJSON(claudeResponse);
        analysisResult = JSON.parse(cleanedResponse);

        if (!this.isValidAnalysisResult(analysisResult)) {
          throw new Error('Invalid analysis result structure');
        }
        
        console.log('=== CLAUDE TRASH ANALYSIS SUCCESS ===');
        return {
          trashType: analysisResult.trashType || 'Analysis failed',
          disposalMethod: analysisResult.disposalMethod || 'Classify as general waste',
          countrySpecificGuidelines: analysisResult.countrySpecificGuidelines || 'Please check your country-specific regulations',
          confidence: Math.min(100, Math.max(0, analysisResult.confidence || 50)),
          additionalTips: Array.isArray(analysisResult.additionalTips) ? analysisResult.additionalTips : []
        };
        
      } catch (parseError) {
        console.error('Claude response parsing failed:', parseError);
        throw new Error('Claude parsing failed: ' + parseError.message);
      }
      
    } catch (claudeError) {
      console.error('=== CLAUDE TRASH ANALYSIS FAILED ===');
      console.error('Claude error:', claudeError.message);
      
      // Try Gemini as backup
      try {
        console.log('=== ATTEMPTING GEMINI BACKUP TRASH ANALYSIS ===');
        const geminiResponse = await this.geminiService.analyzeImageWithText(imageUrl, analysisPrompt);
        console.log('Gemini response received for trash analysis');
        
        let analysisResult;
        try {
          const cleanedResponse = this.extractAndCleanJSON(geminiResponse);
          analysisResult = JSON.parse(cleanedResponse);

          if (!this.isValidAnalysisResult(analysisResult)) {
            throw new Error('Invalid analysis result structure');
          }
          
          console.log('=== GEMINI BACKUP TRASH ANALYSIS SUCCESS ===');
          return {
            trashType: `${analysisResult.trashType || 'Analysis completed'}`,
            disposalMethod: `Gemini analysis: ${analysisResult.disposalMethod || 'Classify as general waste'}`,
            countrySpecificGuidelines: analysisResult.countrySpecificGuidelines || 'Please check your country-specific regulations',
            confidence: Math.min(100, Math.max(0, analysisResult.confidence || 50)),
            additionalTips: Array.isArray(analysisResult.additionalTips) ? analysisResult.additionalTips : []
          };
          
        } catch (parseError) {
          console.error('Gemini response parsing failed:', parseError);
          throw new Error('Gemini parsing failed: ' + parseError.message);
        }
        
      } catch (geminiError) {
        console.error('=== BOTH CLAUDE AND GEMINI TRASH ANALYSIS FAILED ===');
        console.error('Claude error:', claudeError.message);
        console.error('Gemini error:', geminiError.message);
        
        // Both services failed - return fallback result
        return {
          trashType: 'Analysis failed',
          disposalMethod: 'Classify as general waste or consult local guidelines',
          countrySpecificGuidelines: 'Please retake the image for accurate analysis',
          confidence: 0,
          additionalTips: ['AI analysis services temporarily unavailable', 'Please try again later']
        };
      }
    }
  }

  private extractAndCleanJSON(response: string): string {
    const trimmedResponse = response.trim();

    if (trimmedResponse.startsWith('```json') && trimmedResponse.endsWith('```')) {
      return trimmedResponse.slice(7, -3).trim();
    }

    if (trimmedResponse.startsWith('```') && trimmedResponse.endsWith('```')) {
      return trimmedResponse.slice(3, -3).trim();
    }

    const jsonMatch = trimmedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0].trim();
    }

    return trimmedResponse;
  }

  private isValidAnalysisResult(result: any): boolean {
    return (
        result &&
        typeof result === 'object' &&
        typeof result.trashType === 'string' &&
        typeof result.disposalMethod === 'string' &&
        typeof result.countrySpecificGuidelines === 'string' &&
        typeof result.confidence === 'number' &&
        Array.isArray(result.additionalTips)
    );
  }
}