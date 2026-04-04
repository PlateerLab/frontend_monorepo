import type { TranslationData } from '@xgen/i18n';

export const en: TranslationData = {
  chatNew: {
    title: 'New Chat',
    searchPlaceholder: 'Search workflows...',
    sections: { favorites: 'Favorites', all: 'All Workflows' },
    owner: { all: 'All', personal: 'Personal', shared: 'Shared' },
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
      saveFailed: 'Failed to save'
    }
  }
};
