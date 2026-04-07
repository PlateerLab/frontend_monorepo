import type { TranslationData } from '../types';

/**
 * 공통 번역 (한국어)
 * - common: 공통 UI 요소
 * - sidebar: 사이드바 메뉴
 * - toast: 토스트 메시지
 * - header: 헤더 요소
 */
export const commonKo: TranslationData = {
  common: {
    cancel: '취소',
    confirm: '확인',
    save: '저장',
    delete: '삭제',
    edit: '편집',
    close: '닫기',
    login: '로그인',
    logout: '로그아웃',
    getStarted: '시작하기',
    loading: '로딩 중...',
    welcome: '환영합니다, {{username}}님',
    mypage: '마이페이지로 이동',
    viewAll: '전체 보기',
    refresh: '새로 고침',
    retry: '다시 시도',
    error: '오류가 발생했습니다',
    search: '검색',
    filter: '필터',
    actions: '작업',
    more: '더보기',
    yes: '예',
    no: '아니오',
    create: '생성',
    update: '수정',
    upload: '업로드',
    download: '다운로드',
    copy: '복사',
    share: '공유',
    export: '내보내기',
    import: '가져오기',
  },
  toast: {
    logoutSuccess: '로그아웃되었습니다.',
    logoutError: '로그아웃 처리 중 오류가 발생했습니다.',
    saveSuccess: '저장되었습니다.',
    saveError: '저장에 실패했습니다.',
    deleteSuccess: '삭제되었습니다.',
    deleteError: '삭제에 실패했습니다.',
    copySuccess: '복사되었습니다.',
    copyError: '복사에 실패했습니다.',
    uploadSuccess: '업로드되었습니다.',
    uploadError: '업로드에 실패했습니다.',
    downloadSuccess: '다운로드되었습니다.',
    downloadError: '다운로드에 실패했습니다.',
  },
  sidebar: {
    userMode: '사용자모드',
    adminMode: '관리자모드',
    myPageMode: '마이페이지',
    openSidebar: '사이드바 열기',
    closeSidebar: '사이드바 닫기',
    chat: {
      title: '채팅',
      intro: { title: '채팅 소개' },
      history: { title: '채팅 기록' },
      new: { title: '새 채팅' },
      current: { title: '현재 채팅' },
    },
    workflow: {
      title: '워크플로우',
      intro: { title: '워크플로우 소개' },
      canvas: { title: '캔버스' },
      workflows: { title: '워크플로우 목록' },
      tools: { title: 'API Tool' },
      prompts: { title: '프롬프트' },
      authProfile: { title: '인증 프로필', description: 'API 인증 정보 관리' },
    },
    knowledge: {
      title: '지식관리',
      collections: { title: '문서관리' },
      uploadHistory: { title: '업로드 이력', description: '문서 업로드 처리 이력' },
    },
    model: {
      title: '모델',
      intro: { title: '모델 소개' },
      train: { title: '모델 학습' },
      eval: { title: '모델 평가' },
      storage: { title: '모델 저장소' },
      metrics: { title: '모델 메트릭스' },
    },
    ml: {
      title: 'ML',
      intro: { title: 'ML 소개' },
      train: { title: 'ML 학습' },
      hub: { title: 'ML 허브' },
    },
    data: {
      title: '데이터',
      intro: { title: '데이터 소개' },
      station: { title: '데이터 스테이션' },
      storage: { title: '데이터 저장소' },
    },
    support: {
      title: '지원',
      request: { title: '서비스 요청' },
      faq: { title: 'FAQ' },
    },
    workspace: {
      title: '워크스페이스',
      mainDashboard: { title: '대시보드', description: '메인 대시보드' },
    },
  },
  header: {
    title: 'GEN AI Platform',
  },
};
