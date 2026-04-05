import type { TranslationData } from '@xgen/i18n';

export const en: TranslationData = {
  filter: {
    all: 'All',
    active: 'Active',
    inactive: 'Inactive',
    archived: 'Archived',
  },
  owner: {
    all: 'All',
    personal: 'Personal',
    shared: 'Shared',
  },
  badges: {
    active: 'ACTIVE',
    inactive: 'INACTIVE',
    draft: 'DRAFT',
    archived: 'ARCHIVED',
    shared: 'Shared',
    my: 'My',
    deployed: 'DEPLOYED',
    pending: 'PENDING',
    notDeployed: 'NOT DEPLOYED',
  },
  actions: {
    test: 'Test',
    edit: 'Edit',
    copy: 'Copy',
    delete: 'Delete',
    download: 'Download JSON',
    settings: 'Settings',
  },
  buttons: {
    createNew: 'New Tool',
    multiSelectEnable: 'Select Multiple',
    multiSelectDisable: 'Cancel Select',
    deleteSelected: 'Delete Selected',
    retry: 'Retry',
  },
  card: {
    params: '{{count}} params',
  },
  empty: {
    title: 'No tools found',
    description: 'Create a new tool to get started',
    action: 'Create Tool',
  },
  error: {
    title: 'Failed to load',
    loadFailed: 'Failed to load tools. Please try again.',
    noDeletePermission: 'No permission to delete selected tools.',
  },
  confirm: {
    delete: 'Are you sure you want to delete "{{name}}"?',
    bulkDelete: 'Delete {{count}} selected tools?',
  },
  messages: {
    loadingAuth: 'Loading...',
  },
};
