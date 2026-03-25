import type { TranslationData } from '@xgen/i18n';

export const ko: TranslationData = {
  promptStorage: {
    title: '프롬프트 저장소',
    searchPlaceholder: '프롬프트 검색...',
    createNew: '새 프롬프트',
    filter: { all: '전체', system: '시스템', user: '사용자', template: '템플릿' },
    empty: { title: '프롬프트가 없습니다', description: '새 프롬프트를 만들어보세요' },
    types: {
      system: '시스템',
      user: '사용자',
      template: '템플릿'
    }
  }
};
