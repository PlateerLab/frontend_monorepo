import type { TranslationData } from '@xgen/i18n';

export const ko: TranslationData = {
  collection: {
    searchPlaceholder: '컬렉션 검색...',
    filters: {
      all: '모두',
      personal: '개인',
      shared: '공유',
    },
    buttons: {
      newCollection: '새 컬렉션 생성',
    },
    createModal: {
      title: '새 컬렉션 생성',
      name: '컬렉션 이름',
      namePlaceholder: '컬렉션 이름을 입력하세요',
      description: '설명',
      descriptionPlaceholder: '컬렉션에 대한 설명을 입력하세요',
      sparseVector: '키워드 검색',
      sparseVectorDesc: 'Sparse vector 기반 키워드 검색을 활성화합니다',
      fullText: '전문 검색',
      fullTextDesc: 'Full-text 검색을 활성화합니다',
      encrypt: '암호화',
      encryptDesc: '컬렉션을 비밀번호로 보호합니다',
      create: '생성',
      creating: '생성 중...',
      cancel: '취소',
    },
    empty: {
      title: '컬렉션이 없습니다',
      description: '새 컬렉션을 생성하세요',
    },
    documents: '문서',
    shared: '공유됨',
  },
};
