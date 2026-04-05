import type { TranslationData } from '@xgen/i18n';

export const en: TranslationData = {
  filter: {
    all: 'All',
    my: 'My Uploads',
  },
  badges: {
    tool: 'Tool',
  },
  actions: {
    download: 'Download',
    delete: 'Delete',
    rate: 'Rate',
  },
  buttons: {
    retry: 'Retry',
  },
  card: {
    params: '{{count}} params',
    rating: '{{rating}}/5 ({{count}})',
    noRating: 'No ratings',
  },
  empty: {
    title: 'No tools in library',
    description: 'Upload a tool from your storage to share with others',
  },
  error: {
    title: 'Failed to load',
    loadFailed: 'Failed to load library tools. Please try again.',
  },
  confirm: {
    delete: 'Are you sure you want to remove "{{name}}" from the library?',
  },
  messages: {
    loadingAuth: 'Loading...',
    downloadSuccess: 'Tool downloaded to your storage',
  },
};
