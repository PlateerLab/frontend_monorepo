import type { TranslationData } from '@xgen/i18n';

export const ko: TranslationData = {
  chatHistory: {
    title: '채팅 기록',
    description: '이전 채팅 내역을 확인하고 관리하세요',
    searchPlaceholder: '채팅 검색...',
    filter: { all: '전체', active: '활성', deleted: '삭제됨', deploy: '배포' },
    interactions: '대화',
    continue: '계속하기',
    delete: '삭제',
    deleted: '삭제됨',
    deploy: '배포',
    yesterday: '어제',
    empty: {
      title: '채팅 기록이 없습니다',
      description: '새로운 대화를 시작해보세요',
      action: '새 채팅 시작'
    },
    error: {
      loadFailed: '채팅 기록을 불러오지 못했습니다',
      workflowDeleted: '삭제된 에이전트플로우입니다',
      saveFailed: '저장에 실패했습니다',
      deleteFailed: '삭제에 실패했습니다'
    }
  }
};
