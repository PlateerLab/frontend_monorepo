import type { TranslationData } from '@xgen/i18n';

export const ko: TranslationData = {
  dbDocumentation: {
    // ── Sub-tabs ──
    subTab: {
      connections: '연결',
      documentation: '문서화',
    },

    // ── Status ──
    status: {
      draft: '초안',
      pending: '대기 중',
      active: '실행 중',
      paused: '일시 정지',
      completed: '완료',
      failed: '실패',
      cancelled: '취소됨',
    },

    // ── Schedule Type ──
    scheduleType: {
      once: '1회 실행',
      interval: '반복 실행',
      daily: '매일',
      weekly: '매주',
      cron: 'Cron',
    },

    // ── List view ──
    loading: '문서화 작업을 불러오는 중...',
    loadError: '문서화 작업 목록을 불러오지 못했습니다',
    retry: '다시 시도',
    refresh: '새로고침',
    createNew: '새 문서화 작업',
    emptyTitle: '문서화 작업이 없습니다',
    emptyDescription: 'DB에서 데이터를 추출하여 벡터 컬렉션에 저장하는 작업을 만들어보세요',

    // ── Card ──
    card: {
      total: '전체',
      success: '성공',
      failed: '실패',
    },

    // ── Actions ──
    actions: {
      edit: '편집',
      start: '시작',
      startSuccess: '작업이 시작되었습니다',
      pause: '일시 정지',
      pauseSuccess: '작업이 일시 정지되었습니다',
      resume: '재개',
      resumeSuccess: '작업이 재개되었습니다',
      cancel: '취소',
      cancelSuccess: '작업이 취소되었습니다',
      executeNow: '즉시 실행',
      executeSuccess: '작업이 실행되었습니다',
      delete: '삭제',
      deleteConfirmTitle: '문서화 작업 삭제',
      deleteConfirmMessage: '"{{name}}" 작업을 삭제하시겠습니까?',
      deleteConfirm: '삭제',
      deleteCancel: '취소',
      deleteSuccess: '작업이 삭제되었습니다',
      deleteFailed: '작업 삭제에 실패했습니다',
      error: '작업 처리에 실패했습니다',
    },

    // ── Editor ──
    editor: {
      createTitle: '새 문서화 작업',
      editTitle: '문서화 작업 수정',
      back: '뒤로',
      cancel: '취소',
      save: '저장',
      saving: '저장 중...',
      saved: '문서화 작업이 저장되었습니다',
      saveError: '저장에 실패했습니다',

      // Section: Basic Info
      basicInfo: '기본 정보',
      jobName: '작업 이름',
      jobNamePlaceholder: '문서화 작업 이름을 입력하세요',
      nameRequired: '작업 이름을 입력해주세요',
      targetCollection: '대상 컬렉션',
      selectCollectionPlaceholder: '컬렉션을 선택하세요',
      loadingCollections: '컬렉션 불러오는 중...',
      collectionRequired: '대상 컬렉션을 선택해주세요',
      description: '설명',
      descriptionPlaceholder: '작업에 대한 설명 (선택사항)',

      // Section: Query
      querySection: 'DB 연결 & 쿼리',
      selectConnection: 'DB 연결',
      selectConnectionPlaceholder: 'DB 연결을 선택하세요',
      connectionRequired: 'DB 연결을 선택해주세요',
      query: 'SQL 쿼리',
      queryPlaceholder: 'SELECT * FROM table_name LIMIT 100',
      queryRequired: 'SQL 쿼리를 입력해주세요',
      runQuery: '쿼리 실행',
      running: '실행 중...',
      queryResult: '쿼리 결과',
      resultCount: '{{count}}건 조회됨',
      rows: '건',
      noResults: '결과가 없습니다',
      queryError: '쿼리 실행에 실패했습니다',

      // Section: Schedule
      scheduleSection: '스케줄 설정',
      scheduleType: '스케줄 유형',
      startTime: '시작 시간',
      intervalSeconds: '실행 간격 (초)',
      hour: '시',
      minute: '분',
      weekdays: '요일',
      cronExpression: 'Cron 표현식',
      endTime: '종료 시간',
      maxExecutions: '최대 실행 횟수',
      unlimited: '무제한',

      // Section: Advanced
      advancedOptions: '고급 옵션',
      autoStart: '저장 후 자동 시작',
    },

    // ── Detail Modal ──
    detail: {
      basicInfo: '기본 정보',
      jobName: '작업 이름',
      description: '설명',
      status: '상태',
      owner: '소유자',

      dbSection: 'DB 연결 & 쿼리',
      connection: 'DB 연결',
      collection: '대상 컬렉션',
      query: '쿼리',

      scheduleSection: '스케줄 설정',
      scheduleType: '스케줄 유형',
      cronExpression: 'Cron 표현식',
      interval: '실행 간격',
      intervalUnit: '초',
      runTime: '실행 시간',
      maxExecutions: '최대 실행 횟수',
      maxExecutionsUnit: '회',

      statsSection: '실행 통계',
      totalExecutions: '전체 실행',
      successfulExecutions: '성공',
      failedExecutions: '실패',
      lastExecution: '마지막 실행',
      nextExecution: '다음 실행',

      timeSection: '시간 정보',
      createdAt: '생성일',
      updatedAt: '수정일',

      logsSection: '최근 실행 로그',
      logsLoading: '로그 불러오는 중...',
      noLogs: '실행 로그가 없습니다',
      logSuccess: '성공',
      logFailed: '실패',

      edit: '편집',
      close: '닫기',
    },
  },
};
