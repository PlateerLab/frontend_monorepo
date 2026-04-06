import type { TranslationData } from '@xgen/i18n';

export const en: TranslationData = {
  title: 'Upload History',
  description: 'View processing history of documents uploaded to collections.',
  searchPlaceholder: 'Search file name...',
  filters: {
    all: 'All',
    uploading: 'Uploading',
    processing: 'Processing',
    embedding: 'Embedding',
    complete: 'Complete',
    error: 'Error',
  },
  collectionFilter: {
    all: 'All Collections',
    placeholder: 'Select collection',
  },
  table: {
    fileName: 'File Name',
    collection: 'Collection',
    status: 'Status',
    progress: 'Progress',
    uploadedBy: 'Uploaded By',
    createdAt: 'Upload Date',
    updatedAt: 'Last Updated',
    errorMessage: 'Error Message',
  },
  status: {
    uploading: 'Uploading',
    processing: 'Processing',
    embedding: 'Embedding',
    complete: 'Complete',
    error: 'Error',
  },
  empty: {
    title: 'No upload history',
    description: 'Upload history will appear when documents are uploaded to collections.',
  },
  pagination: {
    showing: '{{from}} - {{to}} of {{total}}',
    prev: 'Previous',
    next: 'Next',
  },
  autoRefresh: 'Auto Refresh',
};
