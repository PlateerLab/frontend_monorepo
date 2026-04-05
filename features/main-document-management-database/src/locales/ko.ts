import type { TranslationData } from '@xgen/i18n';

export const ko: TranslationData = {
  database: {
    searchPlaceholder: '데이터베이스 검색...',
    buttons: {
      newConnection: '새 연결',
    },
    createModal: {
      title: '새 데이터베이스 연결',
      connectionName: '연결 이름',
      connectionNamePlaceholder: '연결 이름을 입력하세요',
      dbType: '데이터베이스 유형',
      host: '호스트',
      hostPlaceholder: 'db.example.com',
      port: '포트',
      database: '데이터베이스',
      databasePlaceholder: '데이터베이스 이름',
      username: '사용자 이름',
      usernamePlaceholder: '사용자 이름',
      password: '비밀번호',
      passwordPlaceholder: '비밀번호',
      ssl: 'SSL 사용',
      sslDesc: 'SSL/TLS 암호화 연결을 사용합니다',
      readOnly: '읽기 전용',
      readOnlyDesc: '읽기 전용 모드로 연결합니다 (권장)',
      create: '연결',
      creating: '연결 중...',
      cancel: '취소',
    },
    error: {
      loadFailed: 'DB 연결 목록을 불러오지 못했습니다',
    },
    empty: {
      title: '데이터베이스 연결이 없습니다',
      description: '새 연결을 추가하세요',
    },
    shared: '공유',
    testConnection: '연결 테스트',
    connected: '연결됨',
    failed: '연결 실패',
  },
};
