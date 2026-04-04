import type { TranslationData } from '@xgen/i18n';

export const en: TranslationData = {
  storage: {
    searchPlaceholder: 'Search file storages...',
    filters: {
      all: 'All',
      personal: 'Personal',
      shared: 'Shared',
    },
    buttons: {
      newStorage: 'New Storage',
    },
    createModal: {
      title: 'Create New File Storage',
      name: 'Storage Name',
      namePlaceholder: 'Enter storage name',
      description: 'Description',
      descriptionPlaceholder: 'Enter a description for the storage',
      encrypt: 'Encryption',
      encryptDesc: 'Protect the storage with a password',
      create: 'Create',
      creating: 'Creating...',
      cancel: 'Cancel',
    },
    empty: {
      title: 'No file storages',
      description: 'Create a new file storage',
    },
    files: 'files',
  },
};
