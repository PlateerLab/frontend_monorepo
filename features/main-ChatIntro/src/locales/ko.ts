import type { TranslationData } from '@xgen/i18n';

export const ko: TranslationData = {
  chatIntro: {
    heroTitle: 'AI와 대화하세요',
    heroDescription: '자연어로 질문하고 즉각적인 답변을 받으세요',
    startNewChat: '새 채팅 시작',
    viewHistory: '기록 보기',
    features: {
      naturalLanguage: {
        title: '자연어 처리',
        description: '일상적인 언어로 AI와 자연스럽게 대화하세요'
      },
      contextSearch: {
        title: '컨텍스트 검색',
        description: '대화 맥락을 이해하고 관련 정보를 검색합니다'
      },
      toolIntegration: {
        title: '도구 통합',
        description: '다양한 도구와 연동하여 작업을 수행합니다'
      }
    },
    quickStart: {
      title: '빠른 시작',
      step1: { title: '워크플로우 선택', description: '사용할 AI 워크플로우를 선택하세요' },
      step2: { title: '질문하기', description: '자연어로 질문을 입력하세요' },
      step3: { title: '답변 받기', description: 'AI가 생성한 답변을 확인하세요' }
    },
    additionalFeatures: {
      title: '추가 기능',
      history: { title: '대화 기록', description: '이전 대화를 언제든 확인하세요' },
      multimodal: { title: '멀티모달', description: '텍스트, 이미지, 파일을 함께 사용하세요' },
      workflow: { title: '워크플로우 연동', description: '채팅에서 바로 워크플로우를 실행하세요' }
    }
  }
};
