import type { TranslationData } from '@xgen/i18n';

export const en: TranslationData = {
  title: 'Tool Storage',
  description: 'Manage and organize your tools',
  searchPlaceholder: 'Search tools...',
  createNew: 'New Tool',
  tabs: {
    storage: 'Storage',
    library: 'Library',
  },
  filter: { all: 'All', api: 'API', function: 'Function', webhook: 'Webhook', database: 'Database', mcp: 'MCP' },
  empty: { title: 'No tools', description: 'Create a new tool' },
  types: {
    api: 'API',
    function: 'Function',
    webhook: 'Webhook',
    database: 'Database',
    mcp: 'MCP',
  },
};
