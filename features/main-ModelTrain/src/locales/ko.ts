import type { TranslationData } from '@xgen/i18n';

export const ko: TranslationData = {
  modelTrain: {
    title: '모델 학습',
    searchPlaceholder: '학습 작업 검색...',
    newTraining: '새 학습',
    tabs: { all: '전체', running: '진행중', completed: '완료', failed: '실패' },
    status: {
      pending: '대기중',
      running: '진행중',
      completed: '완료',
      failed: '실패',
      cancelled: '취소됨'
    },
    start: '시작',
    stop: '중지',
    retry: '재시도',
    viewResults: '결과 보기',
    createdAt: '생성일',
    empty: { title: '학습 작업이 없습니다', description: '새 학습을 시작하세요' }
  }
};
