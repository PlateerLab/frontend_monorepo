import type { TranslationData } from '@xgen/i18n';

export const en: TranslationData = {
  promptStorage: {
    title: 'Prompt Storage',
    searchPlaceholder: 'Search prompts...',
    createNew: 'New Prompt',
    filter: { all: 'All', system: 'System', user: 'User', template: 'Template' },
    empty: { title: 'No prompts', description: 'Create a new prompt' },
    types: {
      system: 'System',
      user: 'User',
      template: 'Template'
    }
  }
};
