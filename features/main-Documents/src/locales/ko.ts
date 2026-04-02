import type { TranslationData } from '@xgen/i18n';

export const ko: TranslationData = {
  documents: {
    title: '지식 관리',
    searchPlaceholder: '검색...',
    upload: '업로드',
    empty: { title: '데이터가 없습니다', description: '데이터를 추가하세요' },
    status: {
      processing: '처리 중',
      indexed: '인덱싱됨',
      failed: '실패',
    },
    types: {
      pdf: 'PDF',
      doc: 'Word',
      txt: '텍스트',
      md: '마크다운',
      html: 'HTML',
      csv: 'CSV',
      xlsx: 'Excel',
    },
    tabs: {
      collections: '컬렉션',
      fileStorage: '파일 저장소',
      repositories: '레포지토리',
      dbConnections: '데이터베이스',
    },
    filters: {
      all: '모두',
      personal: '개인',
      shared: '공유',
    },
    buttons: {
      newCollection: '새 컬렉션 생성',
      newStorage: '새 파일 저장소',
      newRepository: '새 레포지토리',
      newConnection: '새 연결',
      viewAllGraphs: '모든 그래프 보기',
      uploadHistory: '업로드 이력',
      refresh: '새로고침',
    },
    collections: {
      empty: { title: '컬렉션이 없습니다', description: '새 컬렉션을 생성하세요' },
      documents: '문서',
      shared: '공유됨',
    },
    fileStorage: {
      empty: { title: '파일 저장소가 없습니다', description: '새 파일 저장소를 생성하세요' },
      files: '파일',
    },
    repositories: {
      empty: { title: '레포지토리가 없습니다', description: '새 레포지토리를 추가하세요' },
      syncNow: '동기화',
      lastSync: '마지막 동기화',
      active: '활성',
      inactive: '비활성',
    },
    dbConnections: {
      empty: { title: '데이터베이스 연결이 없습니다', description: '새 연결을 추가하세요' },
      testConnection: '연결 테스트',
      connected: '연결됨',
      failed: '연결 실패',
    },
  },
};
