import type { TranslationData } from '@xgen/i18n';

export const ko: TranslationData = {
  workflowIntro: {
    title: '워크플로우',
    hero: {
      title: 'AI 워크플로우 빌더',
      description: '드래그 앤 드롭으로 강력한 AI 파이프라인을 구축하세요',
      primaryAction: '캔버스로 이동',
      secondaryAction: '워크플로우 탐색'
    },
    features: {
      title: '주요 기능',
      canvas: { title: '비주얼 캔버스', description: '직관적인 드래그 앤 드롭 인터페이스' },
      nodes: { title: '다양한 노드', description: 'AI, 데이터, 로직 노드 제공' },
      ai: { title: 'AI 통합', description: '다양한 AI 모델과 쉽게 연동' },
      deploy: { title: '원클릭 배포', description: 'API로 즉시 배포 가능' }
    },
    quickActions: { title: '빠른 실행' },
    actions: {
      createCanvas: '캔버스 생성',
      viewTools: '도구 보기',
      manageDocuments: '문서 관리',
      editPrompts: '프롬프트 편집'
    },
    stats: {
      workflows: '워크플로우',
      nodeTypes: '노드 타입',
      executions: '실행',
      uptime: '가동률'
    }
  }
};
