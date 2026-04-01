import type { TranslationData } from '@xgen/i18n';

export const ko: TranslationData = {
  title: '인증 프로필 관리',
  tabs: {
    storage: '보관함',
    store: '스토어',
  },
  filter: {
    all: '전체',
    active: '활성',
    inactive: '비활성',
  },
  storeFilter: {
    all: '전체',
    my: '내 프로필',
  },
  actions: {
    new: '새 프로필',
    test: '테스트',
    edit: '편집',
    delete: '삭제',
    activate: '활성화',
    deactivate: '비활성화',
    uploadToStore: '스토어에 업로드',
    download: '다운로드',
  },
  search: {
    placeholder: '프로필 검색...',
  },
  empty: {
    title: '인증 프로필이 없습니다',
    description: 'API 인증 정보를 등록하여 워크플로우에서 활용하세요',
  },
  store: {
    empty: {
      title: '스토어에 프로필이 없습니다',
      description: '프로필을 스토어에 공유해보세요',
    },
    addCard: {
      title: '스토어에 등록',
      description: '내 프로필을 스토어에 공유하세요',
    },
    allTags: '전체 태그',
    authType: '인증 타입',
    noDescription: '설명 없음',
  },
  messages: {
    testSuccess: '인증 테스트 성공',
    testFailed: '인증 테스트 실패',
    downloadSuccess: '스토어에서 프로필을 가져왔습니다. payload를 채워주세요.',
    uploadSuccess: '스토어에 프로필이 업로드되었습니다',
    inactive: '비활성화된 프로필입니다',
  },
  confirm: {
    delete: '"{{name}}" 프로필을 삭제하시겠습니까?',
    deleteFromStore: '"{{name}}" 스토어 프로필을 삭제하시겠습니까?',
  },
  error: {
    loadFailed: '프로필을 불러오는데 실패했습니다',
    deleteFailed: '삭제에 실패했습니다',
    statusChangeFailed: '상태 변경에 실패했습니다',
    downloadFailed: '다운로드에 실패했습니다',
    uploadFailed: '업로드에 실패했습니다',
    selectProfile: '업로드할 프로필을 선택해주세요',
  },
  uploadModal: {
    title: '스토어에 업로드',
    selectProfile: '프로필 선택',
    selectPlaceholder: '프로필을 선택하세요',
    tags: '태그',
    tagsPlaceholder: '쉼표로 구분하여 태그 입력',
    upload: '업로드',
  },
};
