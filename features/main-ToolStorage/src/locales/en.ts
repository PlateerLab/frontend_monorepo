import type { TranslationData } from '@xgen/i18n';

export const en: TranslationData = {
  toolStorage: {
    title: 'Tool Storage',
    searchPlaceholder: 'Search tools...',
    createNew: 'New Tool',
    filter: { all: 'All', api: 'API', function: 'Function', webhook: 'Webhook', database: 'Database', mcp: 'MCP' },
    empty: { title: 'No tools', description: 'Create a new tool' },
    types: {
      api: 'API',
      function: 'Function',
      webhook: 'Webhook',
      database: 'Database',
      mcp: 'MCP'
    }
  }
};
