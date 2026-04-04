import type { TranslationData } from '@xgen/i18n';

export const en: TranslationData = {
  collection: {
    searchPlaceholder: 'Search collections...',
    filters: {
      all: 'All',
      personal: 'Personal',
      shared: 'Shared',
    },
    buttons: {
      newCollection: 'New Collection',
    },
    createModal: {
      title: 'Create New Collection',
      name: 'Collection Name',
      namePlaceholder: 'Enter collection name',
      description: 'Description',
      descriptionPlaceholder: 'Enter a description for the collection',
      sparseVector: 'Keyword Search',
      sparseVectorDesc: 'Enable sparse vector based keyword search',
      fullText: 'Full-Text Search',
      fullTextDesc: 'Enable full-text search',
      encrypt: 'Encryption',
      encryptDesc: 'Protect the collection with a password',
      create: 'Create',
      creating: 'Creating...',
      cancel: 'Cancel',
    },
    empty: {
      title: 'No collections',
      description: 'Create a new collection',
    },
    documents: 'documents',
    shared: 'Shared',
  },
};
