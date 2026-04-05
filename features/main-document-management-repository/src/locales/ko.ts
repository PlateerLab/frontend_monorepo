import type { TranslationData } from '@xgen/i18n';

export const ko: TranslationData = {
  repository: {
    searchPlaceholder: '레포지토리 검색...',
    buttons: {
      newRepository: '새 레포지토리',
    },
    createModal: {
      title: '새 레포지토리 연결',
      collectionName: '컬렉션 이름',
      collectionNamePlaceholder: '동기화할 컬렉션 이름을 입력하세요',
      repoName: '레포지토리 이름',
      repoNamePlaceholder: '레포지토리 이름을 입력하세요',
      gitlabUrl: 'GitLab URL',
      gitlabUrlPlaceholder: 'https://gitlab.example.com/group/project',
      accessToken: '액세스 토큰',
      accessTokenPlaceholder: 'GitLab 액세스 토큰을 입력하세요',
      branch: '브랜치',
      cronSchedule: '동기화 스케줄 (Cron)',
      cronPlaceholder: '0 6 * * *',
      cronHint: '예: 0 6 * * * (매일 오전 6시)',
      annotation: '어노테이션 활성화',
      annotationDesc: '문서에 자동 어노테이션을 추가합니다',
      apiExtract: 'API 추출 활성화',
      apiExtractDesc: '코드에서 API 정보를 자동으로 추출합니다',
      create: '연결',
      creating: '연결 중...',
      cancel: '취소',
    },
    error: {
      loadFailed: '레포지토리를 불러오지 못했습니다',
    },
    empty: {
      title: '레포지토리가 없습니다',
      description: '새 레포지토리를 추가하세요',
    },
    syncNow: '동기화',
    lastSync: '마지막 동기화',
    active: '활성',
    inactive: '비활성',
  },
};
