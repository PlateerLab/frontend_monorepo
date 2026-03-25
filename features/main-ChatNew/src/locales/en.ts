import type { TranslationData } from '@xgen/i18n';

export const en: TranslationData = {
  chatNew: {
    title: 'New Chat',
    header: { title: 'Select Workflow', subtitle: 'Choose a workflow to start the conversation' },
    searchPlaceholder: 'Search workflows...',
    sections: { favorites: 'Favorites', all: 'All Workflows' },
    filter: { all: 'All', active: 'Active', draft: 'Draft' },
    owner: { all: 'All', personal: 'Personal', shared: 'Shared' },
    status: { active: 'Active', draft: 'Draft', archived: 'Archived' },
    addFavorite: 'Add to Favorites',
    removeFavorite: 'Remove from Favorites',
    startChat: 'Start Chat',
    personal: 'Personal',
    shared: 'Shared',
    usageCount: 'Usage Count',
    today: 'Today',
    yesterday: 'Yesterday',
    daysAgo: 'days ago',
    empty: { title: 'No workflows', description: 'Create a workflow first' },
    error: {
      loadFailed: 'Failed to load workflows',
      draftWorkflow: 'Cannot use draft workflows',
      saveFailed: 'Failed to save'
    }
  }
};
