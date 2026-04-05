import type { TranslationData } from '@xgen/i18n';

export const ko: TranslationData = {
  filter: {
    all: '전체',
    my: '내 업로드',
  },
  types: {
    system: '시스템',
    user: '사용자',
  },
  badges: {
    template: '템플릿',
  },
  actions: {
    download: '다운로드',
    delete: '삭제',
  },
  buttons: {
    retry: '재시도',
  },
  card: {
    rating: '{{rating}}/5 ({{count}})',
    noRating: '평가 없음',
  },
  empty: {
    title: '라이브러리에 프롬프트가 없습니다',
    description: '저장소에서 프롬프트를 업로드하여 다른 사용자와 공유하세요',
  },
  error: {
    title: '불러오기 실패',
    loadFailed: '라이브러리 프롬프트를 불러오는데 실패했습니다. 다시 시도해주세요.',
  },
  confirm: {
    delete: '"{{name}}"을(를) 라이브러리에서 제거하시겠습니까?',
  },
  messages: {
    loadingAuth: '로딩 중...',
    downloadSuccess: '프롬프트가 저장소에 다운로드되었습니다',
  },
};
