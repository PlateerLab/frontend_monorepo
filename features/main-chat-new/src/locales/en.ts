import type { TranslationData } from '@xgen/i18n';

export const en: TranslationData = {
  chatNew: {
    title: 'New Chat',
    description: 'Select a agentflow to start a new chat',
    searchPlaceholder: 'Search agentflows...',
    sections: { favorites: 'Favorites', all: 'All Agentflows' },
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
    empty: { title: 'No agentflows', description: 'Create a agentflow first' },
    error: {
      loadFailed: 'Failed to load agentflows',
      saveFailed: 'Failed to save'
    }
  }
};
