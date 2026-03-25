import type { TranslationData } from '@xgen/i18n';

export const ko: TranslationData = {
  mlIntro: {
    title: 'ML',
    hero: {
      title: '머신러닝 플랫폼',
      subtitle: 'ML 모델을 쉽게 학습하고 배포하세요',
      startTraining: '학습 시작',
      exploreModels: '모델 탐색'
    },
    capabilities: '주요 기능',
    features: {
      train: { title: 'ML 학습', description: '다양한 알고리즘으로 모델 학습' },
      inference: { title: '추론', description: '실시간 예측 수행' },
      hub: { title: '모델 허브', description: '사전 학습 모델 활용' }
    },
    stats: {
      algorithms: '알고리즘',
      faster: '더 빠른',
      uptime: '가동률',
      scaling: '자동 스케일링'
    },
    workflow: {
      title: 'ML 워크플로우',
      prepare: '데이터 준비',
      train: '모델 학습',
      evaluate: '평가',
      deploy: '배포'
    }
  }
};
