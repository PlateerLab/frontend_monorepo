import type { TranslationData } from '@xgen/i18n';

export const ko: TranslationData = {
  filter: {
    all: '전체',
    active: '활성',
    inactive: '비활성',
    archived: '보관됨',
  },
  owner: {
    all: '전체',
    personal: '개인',
    shared: '공유',
  },
  badges: {
    active: '활성',
    inactive: '비활성',
    draft: '초안',
    archived: '보관됨',
    shared: '공유',
    my: '내 도구',
    deployed: '배포됨',
    pending: '대기',
    notDeployed: '미배포',
  },
  actions: {
    test: '테스트',
    edit: '편집',
    copy: '복사',
    delete: '삭제',
    download: 'JSON 다운로드',
    settings: '설정',
  },
  buttons: {
    createNew: '새 도구',
    multiSelectEnable: '다중 선택',
    multiSelectDisable: '선택 취소',
    deleteSelected: '선택 삭제',
    retry: '재시도',
  },
  card: {
    params: '{{count}}개 매개변수',
  },
  empty: {
    title: '도구가 없습니다',
    description: '새 도구를 만들어 시작하세요',
    action: '도구 만들기',
  },
  error: {
    title: '불러오기 실패',
    loadFailed: '도구를 불러오는데 실패했습니다. 다시 시도해주세요.',
    noDeletePermission: '선택한 도구를 삭제할 권한이 없습니다.',
  },
  confirm: {
    delete: '"{{name}}"을(를) 삭제하시겠습니까?',
    bulkDelete: '선택한 {{count}}개 도구를 삭제하시겠습니까?',
  },
  messages: {
    loadingAuth: '로딩 중...',
  },
};
