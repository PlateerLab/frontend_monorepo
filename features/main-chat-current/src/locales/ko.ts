import type { TranslationData } from '@xgen/i18n';

export const ko: TranslationData = {
  chat: {
    inputPlaceholder: '메시지를 입력하세요...',
    send: '전송',
    sendError: '메시지 전송 실패',
    retry: '재시도',
    attach: '파일 첨부',
    settings: '설정',
    viewHistory: '기록 보기',
    interactionCount: '대화 수',
    currentChat: '현재 채팅',
    newChat: '새 채팅',
    startNewChat: '새 채팅 시작',
    stop: '중지',
    cancelled: '취소됨',
    sessionStarted: '{{agentflowName}} 에이전트플로우가 시작되었습니다',
    emptyState: {
      title: '첫 대화를 시작해보세요!',
      ready: '에이전트플로우가 준비되었습니다'
    },
    suggestions: {
      hello: '안녕하세요!',
      help: '도움이 필요합니다',
      features: '어떤 기능이 있나요?'
    },
    error: {
      noSession: '진행 중인 채팅이 없습니다',
      executionFailed: '실행 중 오류가 발생했습니다'
    }
  }
};
