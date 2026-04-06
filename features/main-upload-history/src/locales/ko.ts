import type { TranslationData } from '@xgen/i18n';

export const ko: TranslationData = {
  title: '문서 업로드 이력',
  description: '컬렉션에 업로드된 문서의 처리 이력을 확인합니다.',
  searchPlaceholder: '파일명 검색...',
  filters: {
    all: '전체',
    uploading: '업로드 중',
    processing: '처리 중',
    embedding: '임베딩 중',
    complete: '완료',
    error: '오류',
  },
  collectionFilter: {
    all: '모든 컬렉션',
    placeholder: '컬렉션 선택',
  },
  table: {
    fileName: '파일명',
    collection: '컬렉션',
    status: '상태',
    progress: '진행률',
    uploadedBy: '업로드한 사용자',
    createdAt: '업로드 일시',
    updatedAt: '최종 수정',
    errorMessage: '오류 메시지',
  },
  status: {
    uploading: '업로드 중',
    processing: '처리 중',
    embedding: '임베딩 중',
    complete: '완료',
    error: '오류',
  },
  empty: {
    title: '업로드 이력이 없습니다',
    description: '컬렉션에 문서를 업로드하면 이력이 표시됩니다.',
  },
  pagination: {
    showing: '{{from}} - {{to}} / 총 {{total}}건',
    prev: '이전',
    next: '다음',
  },
  autoRefresh: '자동 새로고침',
};
