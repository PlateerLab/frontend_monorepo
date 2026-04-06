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
      password: '비밀번호',
      passwordPlaceholder: '비밀번호를 입력하세요',
      passwordConfirm: '비밀번호 확인',
      passwordConfirmPlaceholder: '비밀번호를 다시 입력하세요',
      create: '생성',
      creating: '생성 중...',
      cancel: '취소',
    },
    empty: {
      title: '파일 저장소가 없습니다',
      description: '새 파일 저장소를 생성하세요',
    },
    files: '파일',
    passwordModal: {
      title: '암호화된 저장소',
      description: '이 저장소는 암호로 보호되어 있습니다. 접근하려면 비밀번호를 입력해주세요.',
      passwordLabel: '비밀번호',
      passwordPlaceholder: '비밀번호를 입력하세요',
      passwordRequired: '비밀번호를 입력해주세요.',
      passwordIncorrect: '비밀번호가 일치하지 않습니다.',
      verify: '확인',
      verifying: '확인 중...',
    },
    detail: {
      empty: '파일이 없습니다',
      error: {
        loadFailed: '파일 목록을 불러오지 못했습니다',
      },
      buttons: {
        createFolder: '새 폴더',
        uploadFile: '문서 업로드',
        uploadFolder: '폴더 업로드',
      },
      uploadModal: {
        title: '파일 업로드',
        file: '파일',
        selectFile: '파일을 선택하세요',
        upload: '업로드',
        uploading: '업로드 중...',
      },
      createFolderModal: {
        title: '폴더 생성',
        name: '폴더 이름',
        namePlaceholder: '폴더 이름을 입력하세요',
      },
      directoryTree: {
        title: '디렉토리 구조',
        filesSuffix: ' 파일',
        searchPlaceholder: '파일 검색...',
      },
    },
  },
};
