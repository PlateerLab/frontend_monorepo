import type { TranslationData } from '@xgen/i18n';

export const ko: TranslationData = {
  toolStorage: {
    title: '도구 저장소',
    description: '워크플로우에서 사용할 도구를 관리하세요',
    searchPlaceholder: '도구 검색...',
    createNew: '새 도구',
    filter: { all: '전체', api: 'API', function: '함수', webhook: '웹훅', database: '데이터베이스', mcp: 'MCP' },
    empty: { title: '도구가 없습니다', description: '새 도구를 만들어보세요' },
    types: {
      api: 'API',
      function: '함수',
      webhook: '웹훅',
      database: '데이터베이스',
      mcp: 'MCP'
    }
  }
};
