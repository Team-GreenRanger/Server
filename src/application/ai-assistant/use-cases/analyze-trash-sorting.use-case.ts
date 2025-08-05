import { Injectable, Inject } from '@nestjs/common';
import type { IUserRepository } from '../../../domain/user/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../../../domain/user/repositories/user.repository.interface';
import { ClaudeService } from '../../../infrastructure/external-apis/claude/claude.service';

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
  ) {}

  async execute(request: TrashSortingRequest): Promise<TrashSortingResult> {
    // 사용자 정보 조회하여 국가 정보 가져오기
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // 기본값으로 한국 설정, 사용자 nationality가 있으면 사용
    const userCountry = user.nationality || 'KR';
    
    // 국가별 쓰레기 분리수거 규정 정보
    const countryGuidelines = this.getCountrySpecificGuidelines(userCountry);
    
    // Claude AI를 통한 쓰레기 분석
    const analysis = await this.analyzeTrashWithClaude(request.imageUrl, userCountry, countryGuidelines);
    
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
      'KR': `한국 분리수거 기본 규칙:
      - 플라스틱: 내용물 비우고 라벨 제거 후 플라스틱 전용 수거함
      - 종이: 테이프, 스테이플러 등 제거 후 종이류 수거함  
      - 캔/금속: 내용물 비우고 캔류 수거함
      - 유리: 뚜껑 분리 후 유리병 수거함
      - 일반쓰레기: 종량제봉투 사용
      - 음식물쓰레기: 물기 제거 후 음식물쓰레기통`,
      
      'US': `US Recycling Guidelines:
      - Plastic: Remove caps, rinse containers, check recycling number
      - Paper: Remove staples, separate by type (cardboard, mixed paper)
      - Metal: Rinse cans and containers
      - Glass: Remove lids, separate by color in some areas
      - General waste: Regular trash bags
      - Organic waste: Compost bins where available`,
      
      'JP': `日本のゴミ分別ルール:
      - プラスチック: 内容物を空にして洗浄、プラマーク確認
      - 紙類: ホッチキス等除去、資源ゴミへ
      - 缶類: 中身を空にして缶・ビン・ペットボトルへ
      - 生ゴミ: 燃えるゴミの日に出す
      - 不燃ゴミ: 決められた収集日に`,
      
      'DE': `Deutsche Mülltrennung:
      - Gelber Sack: Verpackungen aus Kunststoff, Metall
      - Papiertonne: Zeitungen, Kartons (ohne Klebeband)
      - Glascontainer: Nach Farben getrennt
      - Biotonne: Organische Abfälle
      - Restmüll: Nicht recyclebare Materialien`,
    };
    
    return guidelines[countryCode] || guidelines['KR']; // 기본값은 한국
  }

  private async analyzeTrashWithClaude(imageUrl: string, userCountry: string, guidelines: string): Promise<{
    trashType: string;
    disposalMethod: string;
    countrySpecificGuidelines: string;
    confidence: number;
    additionalTips: string[];
  }> {
    try {
      // Claude에게 보낼 프롬프트 구성
      const analysisPrompt = `이미지를 분석하여 쓰레기의 종류와 올바른 분리수거 방법을 알려주세요.

사용자 국가: ${userCountry}
해당 국가 분리수거 규정:
${guidelines}

다음 JSON 형식으로 정확히 응답해주세요:
{
  "trashType": "쓰레기 종류 (예: 플라스틱병, 종이상자, 캔 등)",
  "disposalMethod": "구체적인 버리는 방법",
  "countrySpecificGuidelines": "해당 국가의 특별한 규정이나 주의사항",
  "confidence": 신뢰도_숫자_0부터_100,
  "additionalTips": ["추가 팁1", "추가 팁2"]
}

중요한 점:
- 이미지에서 보이는 물체를 정확히 식별하세요
- 해당 국가의 분리수거 규정에 맞춰 설명하세요
- 확실하지 않다면 confidence를 낮게 설정하세요
- 실용적이고 구체적인 조언을 제공하세요`;

      const responseMessage = await this.claudeService.analyzeImageWithText(imageUrl, analysisPrompt);
      
      // JSON 파싱 시도
      let analysisResult;
      try {
        // Claude 응답에서 JSON 부분만 추출
        const jsonMatch = responseMessage.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('JSON not found in response');
        }
      } catch (parseError) {
        console.error('Claude 응답 파싱 실패:', parseError);
        // JSON 파싱 실패시 기본값 반환
        analysisResult = {
          trashType: '일반 쓰레기',
          disposalMethod: '종량제봉투에 버리세요',
          countrySpecificGuidelines: '정확한 분석이 어렵습니다. 의심스러우면 일반쓰레기로 분류하세요.',
          confidence: 30,
          additionalTips: ['이미지가 불명확한 경우 가까운 주민센터에 문의하세요']
        };
      }

      return {
        trashType: analysisResult.trashType || '분석 불가',
        disposalMethod: analysisResult.disposalMethod || '일반쓰레기로 분류',
        countrySpecificGuidelines: analysisResult.countrySpecificGuidelines || '해당 국가 규정을 확인하세요',
        confidence: Math.min(100, Math.max(0, analysisResult.confidence || 50)),
        additionalTips: Array.isArray(analysisResult.additionalTips) ? analysisResult.additionalTips : []
      };
      
    } catch (error) {
      console.error('Claude 쓰레기 분석 실패:', error);
      // Claude 서비스 오류시 기본 응답
      return {
        trashType: '분석 실패',
        disposalMethod: '일반쓰레기로 분류하거나 전문가에게 문의하세요',
        countrySpecificGuidelines: '정확한 분석을 위해 이미지를 다시 촬영해주세요',
        confidence: 0,
        additionalTips: ['AI 분석 서비스에 일시적 문제가 발생했습니다', '나중에 다시 시도해주세요']
      };
    }
  }
}
