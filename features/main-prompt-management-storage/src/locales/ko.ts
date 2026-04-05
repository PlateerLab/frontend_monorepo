import type { TranslationData } from '@xgen/i18n';

export const ko: TranslationData = {
  searchPlaceholder: '프롬프트 검색...',
  createNew: '새 프롬프트',
  filter: {
    all: '전체',
    system: '시스템',
    user: '사용자',
    template: '템플릿',
  },
  owner: {
    all: '전체',
    personal: '개인',
    shared: '공유',
  },
  types: {
    system: '시스템',
    user: '사용자',
  },
  badges: {
    template: '템플릿',
    shared: '공유',
    personal: '개인',
  },
  actions: {
    edit: '편집',
    duplicate: '복제',
    delete: '삭제',
    uploadToStore: '라이브러리에 업로드',
  },
  buttons: {
    retry: '재시도',
  },
  empty: {
    title: '프롬프트가 없습니다',
    description: '새 프롬프트를 만들어보세요',
  },
  error: {
    title: '불러오기 실패',
    loadFailed: '프롬프트를 불러오는데 실패했습니다. 다시 시도해주세요.',
    noDeletePermission: '본인이 만든 프롬프트만 삭제할 수 있습니다.',
  },
  confirm: {
    delete: '"{{name}}"을(를) 삭제하시겠습니까?',
  },
  messages: {
    loadingAuth: '로딩 중...',
  },
};
