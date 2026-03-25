import type { TranslationData } from '@xgen/i18n';

export const ko: TranslationData = {
  modelIntro: {
    title: '모델',
    hero: {
      title: '모델 허브',
      subtitle: 'AI 모델을 학습, 평가, 관리하세요',
      startTraining: '학습 시작',
      browseModels: '모델 탐색'
    },
    capabilities: '주요 기능',
    features: {
      train: { title: '모델 학습', description: '커스텀 모델을 학습시키세요' },
      eval: { title: '모델 평가', description: '모델 성능을 평가하세요' },
      storage: { title: '모델 저장소', description: '모델을 저장하고 관리하세요' },
      metrics: { title: '모델 메트릭스', description: '실시간 성능 모니터링' }
    },
    stats: {
      trainedModels: '학습된 모델',
      pretrainedModels: '사전 학습 모델',
      accuracy: '평균 정확도',
      monitoring: '실시간 모니터링'
    }
  }
};
