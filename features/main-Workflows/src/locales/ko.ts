import type { TranslationData } from '@xgen/i18n';

export const ko: TranslationData = {
  title: '워크플로우',
  tabs: {
    storage: '보관함',
    store: '스토어',
    scheduler: '스케줄러',
    tester: '테스터',
  },
  filter: {
    all: '전체',
    active: '활성',
    archived: '보관됨',
    unactive: '비활성',
    personal: '개인',
    shared: '공유',
  },
  actions: {
    execute: '실행',
    edit: '편집',
    copy: '복제',
    delete: '삭제',
    logs: '로그',
    settings: '설정',
    deployInfo: '배포 정보',
    deploySettings: '배포 설정',
    versions: '버전 기록',
    createNew: '새 워크플로우',
  },
  confirm: {
    delete: '"{{name}}" 워크플로우를 삭제하시겠습니까?',
    bulkDelete: '{{count}}개의 워크플로우를 삭제하시겠습니까?',
  },
  messages: {
    readOnly: '읽기 전용 워크플로우입니다',
    unactive: '비활성화된 워크플로우입니다',
  },
  error: {
    loadFailed: '워크플로우를 불러오는데 실패했습니다',
    noDeletePermission: '삭제 권한이 없습니다',
  },
  card: {
    organization: '조직',
    nodes: '노드',
  },
  empty: {
    title: '워크플로우가 없습니다',
    description: '새 워크플로우를 만들어보세요',
  },
  // Store
  store: {
    title: '워크플로우 스토어',
    searchPlaceholder: '워크플로우 검색...',
    filter: {
      all: '전체',
      my: '내 워크플로우',
    },
    addCard: {
      title: '스토어에 등록',
      description: '워크플로우를 스토어에 공유하세요',
    },
    allTags: '전체 태그',
    actions: {
      download: '다운로드',
      delete: '삭제',
    },
    empty: {
      title: '스토어에 워크플로우가 없습니다',
      description: '워크플로우를 공유해보세요',
    },
    messages: {
      downloadSuccess: '스토어에서 워크플로우를 가져왔습니다',
      uploadSuccess: '스토어에 업로드되었습니다',
    },
  },
  // Scheduler
  scheduler: {
    title: '워크플로우 스케줄러',
    searchPlaceholder: '스케줄 검색...',
    filter: {
      all: '전체',
      active: '활성',
      paused: '일시정지',
      completed: '완료',
    },
    createNew: '새 스케줄',
    empty: {
      title: '스케줄이 없습니다',
      description: '워크플로우 실행 스케줄을 설정하세요',
    },
    fields: {
      schedule: '스케줄',
      nextRun: '다음 실행',
      lastRun: '마지막 실행',
      runCount: '실행 횟수',
    },
    actions: {
      pause: '일시정지',
      resume: '재개',
      edit: '편집',
      delete: '삭제',
      runNow: '지금 실행',
    },
    messages: {
      pauseSuccess: '스케줄이 일시정지되었습니다',
      resumeSuccess: '스케줄이 재개되었습니다',
      runSuccess: '스케줄이 실행되었습니다',
    },
  },
  // Tester
  tester: {
    title: '워크플로우 테스터',
    selectWorkflow: '테스트할 워크플로우를 선택하세요',
    searchPlaceholder: '워크플로우 검색...',
    filter: {
      all: '전체',
      recent: '최근 테스트',
    },
    empty: {
      title: '테스트 기록이 없습니다',
      description: '워크플로우를 선택하여 테스트를 시작하세요',
    },
    actions: {
      runTest: '테스트 실행',
      viewLogs: '로그 보기',
    },
    fields: {
      input: '입력',
      output: '출력',
      duration: '실행 시간',
      status: '상태',
    },
    status: {
      success: '성공',
      failed: '실패',
      running: '실행 중',
    },
  },
};
