import type { TranslationData } from '@xgen/i18n';

export const en: TranslationData = {
  searchPlaceholder: 'Search prompts...',
  createNew: 'New Prompt',
  filter: {
    all: 'All',
    system: 'System',
    user: 'User',
    template: 'Template',
  },
  owner: {
    all: 'All',
    personal: 'Personal',
    shared: 'Shared',
  },
  types: {
    system: 'System',
    user: 'User',
  },
  badges: {
    template: 'Template',
    shared: 'Shared',
    personal: 'Personal',
  },
  actions: {
    edit: 'Edit',
    duplicate: 'Duplicate',
    delete: 'Delete',
    uploadToStore: 'Upload to Library',
  },
  buttons: {
    retry: 'Retry',
  },
  empty: {
    title: 'No prompts',
    description: 'Create a new prompt to get started',
  },
  error: {
    title: 'Failed to load',
    loadFailed: 'Failed to load prompts. Please try again.',
    noDeletePermission: 'You can only delete your own prompts.',
  },
  confirm: {
    delete: 'Are you sure you want to delete "{{name}}"?',
  },
  messages: {
    loadingAuth: 'Loading...',
  },
};
