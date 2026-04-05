import type { TranslationData } from '@xgen/i18n';

export const en: TranslationData = {
  filter: {
    all: 'All',
    my: 'My Uploads',
  },
  types: {
    system: 'System',
    user: 'User',
  },
  badges: {
    template: 'Template',
  },
  actions: {
    download: 'Download',
    delete: 'Delete',
  },
  buttons: {
    retry: 'Retry',
  },
  card: {
    rating: '{{rating}}/5 ({{count}})',
    noRating: 'No ratings',
  },
  empty: {
    title: 'No prompts in library',
    description: 'Upload a prompt from your storage to share with others',
  },
  error: {
    title: 'Failed to load',
    loadFailed: 'Failed to load library prompts. Please try again.',
  },
  confirm: {
    delete: 'Are you sure you want to remove "{{name}}" from the library?',
  },
  messages: {
    loadingAuth: 'Loading...',
    downloadSuccess: 'Prompt downloaded to your storage',
  },
};
