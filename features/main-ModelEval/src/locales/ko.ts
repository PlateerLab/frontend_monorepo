import type { TranslationData } from '@xgen/i18n';

export const ko: TranslationData = {
  modelEval: {
    title: '모델 평가',
    searchPlaceholder: '평가 검색...',
    newEvaluation: '새 평가',
    tabs: { all: '전체', running: '진행중', completed: '완료' },
    status: { running: '진행중', completed: '완료', failed: '실패' },
    compareModels: '모델 비교',
    exportReport: '리포트 내보내기',
    confusionMatrix: '혼동 행렬',
    evaluationInProgress: '평가 진행중...',
    empty: { title: '평가가 없습니다', description: '새 평가를 시작하세요' }
  }
};
