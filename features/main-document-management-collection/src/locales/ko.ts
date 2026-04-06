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
      password: '비밀번호',
      passwordPlaceholder: '비밀번호를 입력하세요',
      passwordConfirm: '비밀번호 확인',
      passwordConfirmPlaceholder: '비밀번호를 다시 입력하세요',
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
    passwordModal: {
      title: '암호화된 컬렉션',
      description: '이 컬렉션은 암호로 보호되어 있습니다. 접근하려면 비밀번호를 입력해주세요.',
      passwordLabel: '비밀번호',
      passwordPlaceholder: '비밀번호를 입력하세요',
      passwordRequired: '비밀번호를 입력해주세요.',
      passwordIncorrect: '비밀번호가 일치하지 않습니다.',
      verify: '확인',
      verifying: '확인 중...',
    },
    detail: {
      empty: '문서가 없습니다',
      noChunks: '청크가 없습니다',
      error: {
        loadFailed: '문서 목록을 불러오지 못했습니다',
        loadDetailFailed: '문서 상세를 불러오지 못했습니다',
      },
      buttons: {
        upload: '문서 업로드',
        createFolder: '새 폴더',
      },
      uploadModal: {
        title: '문서 업로드',
        file: '파일',
        selectFile: '파일을 선택하세요',
        chunkSize: '청크 크기',
        chunkOverlap: '청크 오버랩',
        upload: '업로드',
        uploading: '업로드 중...',
      },
      createFolderModal: {
        title: '폴더 생성',
        name: '폴더 이름',
        namePlaceholder: '폴더 이름을 입력하세요',
      },
      uploadStatus: {
        uploading: '업로드 중...',
        processing: '처리 중...',
        embedding: '임베딩 중...',
        complete: '완료',
        error: '오류',
      },
      directoryTree: {
        title: '디렉토리 구조',
        filesSuffix: '개',
        searchPlaceholder: '파일 검색...',
      },
    },
  },
};
