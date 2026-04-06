import type { TranslationData } from '@xgen/i18n';

export const ko: TranslationData = {
  database: {
    searchPlaceholder: '데이터베이스 검색...',
    buttons: {
      newConnection: '새 연결',
    },

    // ── Filters ──
    filters: {
      all: '모두',
      personal: '개인',
      shared: '공유',
    },

    // ── Status Badges ──
    badges: {
      active: '활성',
      inactive: '비활성',
      success: '성공',
      failed: '실패',
    },

    // ── Actions ──
    actions: {
      test: '연결 테스트',
      edit: '수정',
      activate: '활성화',
      deactivate: '비활성화',
      share: '공유 설정',
      documentation: '문서화',
      delete: '삭제',
    },

    // ── Toast Messages ──
    toast: {
      createSuccess: '데이터베이스 연결이 생성되었습니다',
      createFailed: '데이터베이스 연결 생성에 실패했습니다',
      updateSuccess: '데이터베이스 연결이 수정되었습니다',
      updateFailed: '데이터베이스 연결 수정에 실패했습니다',
      deleteSuccess: '데이터베이스 연결이 삭제되었습니다',
      deleteFailed: '데이터베이스 연결 삭제에 실패했습니다',
      activated: '데이터베이스 연결이 활성화되었습니다',
      deactivated: '데이터베이스 연결이 비활성화되었습니다',
      toggleFailed: '상태 변경에 실패했습니다',
      testSuccess: '연결 테스트에 성공했습니다',
      testFailed: '연결 테스트에 실패했습니다 {{message}}',
      shareEnabled: '{{name}} 공유가 활성화되었습니다',
      shareDisabled: '{{name}} 공유가 비활성화되었습니다',
      shareFailed: '공유 설정 변경에 실패했습니다',
    },

    // ── Create Modal ──
    createModal: {
      title: '새 데이터베이스 연결',
    },

    // ── Edit Modal ──
    editModal: {
      title: '데이터베이스 연결 수정',
    },

    // ── Share Modal ──
    shareModal: {
      title: '공유 설정',
      description: '{{name}} 연결의 공유 설정을 변경합니다',
      shared: '공유됨 (다른 사용자가 접근 가능)',
      private: '비공개 (나만 접근 가능)',
      save: '저장',
      saving: '저장 중...',
    },

    // ── Form (shared Create/Edit) ──
    form: {
      connectionName: '연결 이름',
      connectionNamePlaceholder: '연결 이름을 입력하세요',
      description: '설명',
      descriptionPlaceholder: '연결에 대한 설명을 입력하세요',
      customPassword: '커스텀 비밀번호',
      customPasswordPlaceholder: '커스텀 비밀번호 입력',
      customPasswordDesc: '이 연결에 대한 별도의 접근 비밀번호를 설정합니다',
      sectionConnection: '데이터베이스 연결',
      dbType: '데이터베이스 유형',
      host: '호스트',
      hostPlaceholder: 'db.example.com',
      port: '포트',
      database: '데이터베이스',
      databasePlaceholder: '데이터베이스 이름',
      schema: '스키마',
      username: '사용자 이름',
      usernamePlaceholder: '사용자 이름',
      password: '비밀번호',
      passwordPlaceholder: '비밀번호',
      passwordUnchanged: '변경하지 않으려면 비워두세요',
      ssl: 'SSL 사용',
      sslDesc: 'SSL/TLS 암호화 연결을 사용합니다',
      sectionSettings: '연결 설정',
      connectionTimeout: '연결 타임아웃 (초)',
      queryTimeout: '쿼리 타임아웃 (초)',
      poolSize: '풀 사이즈',
      maxOverflow: '최대 오버플로',
      sectionPolicy: '쿼리 정책',
      readOnly: '읽기 전용',
      readOnlyDesc: '읽기 전용 모드로 연결합니다 (권장)',
      maxRowsLimit: '최대 행 수',
      allowedTables: '허용 테이블',
      allowedTablesPlaceholder: '쉼표로 구분 (비워두면 전체 허용)',
      deniedTables: '차단 테이블',
      deniedTablesPlaceholder: '쉼표로 구분 (비워두면 차단 없음)',
      create: '연결',
      creating: '연결 중...',
      update: '수정',
      updating: '수정 중...',
      cancel: '취소',
    },

    // ── Error & Empty States ──
    error: {
      loadFailed: 'DB 연결 목록을 불러오지 못했습니다',
    },
    empty: {
      title: '데이터베이스 연결이 없습니다',
      description: '새 연결을 추가하세요',
    },
  },
};
