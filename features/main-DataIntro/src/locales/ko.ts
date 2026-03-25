import type { TranslationData } from '@xgen/i18n';

export const ko: TranslationData = {
  dataIntro: {
    title: '데이터',
    hero: {
      title: '데이터 플랫폼',
      subtitle: '데이터를 통합하고 관리하세요',
      manageStorage: '저장소 관리',
      exploreData: '데이터 탐색'
    },
    capabilities: '주요 기능',
    features: {
      station: { title: '데이터 스테이션', description: '다양한 소스에서 데이터 수집' },
      storage: { title: '데이터 저장소', description: '데이터셋 저장 및 관리' },
      pipeline: { title: '데이터 파이프라인', description: '자동화된 데이터 처리' }
    },
    stats: {
      connectors: '커넥터',
      storage: '저장 용량',
      rowsPerSec: '초당 처리량',
      reliability: '안정성'
    },
    supportedSources: '지원 소스'
  }
};
