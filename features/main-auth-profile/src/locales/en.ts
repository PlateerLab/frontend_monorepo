import type { TranslationData } from '@xgen/i18n';

export const en: TranslationData = {
  title: 'Auth Profile Management',
  description: 'Manage and share API authentication profiles',
  tabs: {
    storage: 'Storage',
    store: 'Store',
  },
  filter: {
    all: 'All',
    active: 'Active',
    inactive: 'Inactive',
  },
  storeFilter: {
    all: 'All',
    my: 'My Profiles',
  },
  actions: {
    new: 'New Profile',
    test: 'Test',
    edit: 'Edit',
    delete: 'Delete',
    activate: 'Activate',
    deactivate: 'Deactivate',
    uploadToStore: 'Upload to Store',
    download: 'Download',
  },
  search: {
    placeholder: 'Search profiles...',
  },
  empty: {
    title: 'No auth profiles',
    description: 'Register API authentication to use in agentflows',
  },
  store: {
    empty: {
      title: 'No profiles in store',
      description: 'Share your profiles to the store',
    },
    addCard: {
      title: 'Add to Store',
      description: 'Share your profile to the store',
    },
    allTags: 'All Tags',
    authType: 'Auth Type',
    noDescription: 'No description',
  },
  messages: {
    testSuccess: 'Authentication test successful',
    testFailed: 'Authentication test failed',
    downloadSuccess: 'Profile downloaded from store. Please fill in the payload.',
    uploadSuccess: 'Profile uploaded to store',
    inactive: 'This profile is inactive',
  },
  confirm: {
    delete: 'Delete profile "{{name}}"?',
    deleteFromStore: 'Delete store profile "{{name}}"?',
  },
  error: {
    loadFailed: 'Failed to load profiles',
    deleteFailed: 'Failed to delete',
    statusChangeFailed: 'Failed to change status',
    downloadFailed: 'Failed to download',
    uploadFailed: 'Failed to upload',
    selectProfile: 'Please select a profile to upload',
  },
  uploadModal: {
    title: 'Upload to Store',
    selectProfile: 'Select Profile',
    selectPlaceholder: 'Select a profile',
    tags: 'Tags',
    tagsPlaceholder: 'Enter tags separated by commas',
    upload: 'Upload',
  },
};
