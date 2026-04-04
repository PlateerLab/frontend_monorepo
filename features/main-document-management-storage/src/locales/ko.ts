import type { TranslationData } from '@xgen/i18n';

export const ko: TranslationData = {
  storage: {
    searchPlaceholder: '파일 저장소 검색...',
    filters: {
      all: '모두',
      personal: '개인',
      shared: '공유',
    },
    buttons: {
      newStorage: '새 저장소 생성',
    },
    createModal: {
      title: '새 파일 저장소 생성',
      name: '저장소 이름',
      namePlaceholder: '저장소 이름을 입력하세요',
      description: '설명',
      descriptionPlaceholder: '저장소에 대한 설명을 입력하세요',
      encrypt: '암호화',
      encryptDesc: '저장소를 비밀번호로 보호합니다',
      create: '생성',
      creating: '생성 중...',
      cancel: '취소',
    },
    empty: {
      title: '파일 저장소가 없습니다',
      description: '새 파일 저장소를 생성하세요',
    },
    files: '파일',
  },
};
