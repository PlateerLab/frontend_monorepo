import type { TranslationData } from '@xgen/i18n';

export const ko: TranslationData = {
  searchPlaceholder: '프로필 검색...',
  filter: {
    all: '전체',
    my: '내 프로필',
  },
  actions: {
    download: '다운로드',
    delete: '삭제',
    upload: '프로필 공유',
  },
  empty: {
    title: '라이브러리에 프로필이 없습니다',
    description: '보관함에서 프로필을 라이브러리에 공유해보세요.',
  },
  error: {
    title: '오류',
    loadFailed: '라이브러리 프로필을 불러오는데 실패했습니다',
    downloadFailed: '다운로드에 실패했습니다',
    deleteFailed: '삭제에 실패했습니다',
  },
  messages: {
    downloadSuccess: '"{{name}}" 프로필을 보관함으로 가져왔습니다.',
    deleteSuccess: '"{{name}}" 프로필이 라이브러리에서 삭제되었습니다',
    deleteFailed: '"{{name}}" 프로필 삭제에 실패했습니다',
  },
  confirm: {
    deleteTitle: '라이브러리에서 삭제',
    delete: '"{{name}}" 프로필을 라이브러리에서 삭제하시겠습니까?',
    confirmDelete: '삭제',
    cancel: '취소',
  },
  allTags: '전체 태그',
  buttons: {
    retry: '다시 시도',
  },
  upload: {
    title: '라이브러리에 프로필 공유',
    selectProfile: '프로필 선택',
    selectProfilePlaceholder: '공유할 프로필을 선택하세요',
    description: '설명',
    descriptionPlaceholder: '프로필에 대한 설명을 입력하세요',
    tags: '태그',
    tagsPlaceholder: '태그를 쉼표로 구분하여 입력 (예: auth, api, login)',
    tagsHint: '쉼표(,)로 구분하여 여러 태그를 입력할 수 있습니다.',
    cancel: '취소',
    submit: '공유',
    uploading: '공유 중...',
    success: '프로필이 라이브러리에 공유되었습니다.',
    errors: {
      loadProfilesFailed: '보관함 프로필 목록을 불러오는데 실패했습니다',
      selectProfile: '공유할 프로필을 선택해주세요',
      uploadFailed: '라이브러리 공유에 실패했습니다',
    },
  },
};
