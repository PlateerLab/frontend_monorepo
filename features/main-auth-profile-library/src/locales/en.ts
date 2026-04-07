import type { TranslationData } from '@xgen/i18n';

export const en: TranslationData = {
  searchPlaceholder: 'Search profiles...',
  filter: {
    all: 'All',
    my: 'My Profiles',
  },
  actions: {
    download: 'Download',
    delete: 'Delete',
    upload: 'Share Profile',
  },
  empty: {
    title: 'No profiles in library',
    description: 'Share your profiles from storage to the library.',
  },
  error: {
    title: 'Error',
    loadFailed: 'Failed to load library profiles',
    downloadFailed: 'Failed to download',
    deleteFailed: 'Failed to delete',
  },
  messages: {
    downloadSuccess: 'Profile "{{name}}" downloaded to storage.',
    deleteSuccess: 'Profile "{{name}}" deleted from library',
    deleteFailed: 'Failed to delete profile "{{name}}"',
  },
  confirm: {
    deleteTitle: 'Delete from Library',
    delete: 'Delete profile "{{name}}" from library?',
    confirmDelete: 'Delete',
    cancel: 'Cancel',
  },
  allTags: 'All Tags',
  buttons: {
    retry: 'Retry',
  },
  upload: {
    title: 'Share Profile to Library',
    selectProfile: 'Select Profile',
    selectProfilePlaceholder: 'Select a profile to share',
    description: 'Description',
    descriptionPlaceholder: 'Enter a description for this profile',
    tags: 'Tags',
    tagsPlaceholder: 'Enter tags separated by commas (e.g. auth, api, login)',
    tagsHint: 'Separate multiple tags with commas.',
    cancel: 'Cancel',
    submit: 'Share',
    uploading: 'Sharing...',
    success: 'Profile shared to library successfully.',
    errors: {
      loadProfilesFailed: 'Failed to load storage profiles',
      selectProfile: 'Please select a profile to share',
      uploadFailed: 'Failed to share to library',
    },
  },
};
