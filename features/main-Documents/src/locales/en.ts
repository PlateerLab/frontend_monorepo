import type { TranslationData } from '@xgen/i18n';

export const en: TranslationData = {
  documents: {
    title: 'Knowledge Management',
    searchPlaceholder: 'Search...',
    upload: 'Upload',
    empty: { title: 'No data', description: 'Add your data' },
    status: {
      processing: 'Processing',
      indexed: 'Indexed',
      failed: 'Failed',
    },
    types: {
      pdf: 'PDF',
      doc: 'Word',
      txt: 'Text',
      md: 'Markdown',
      html: 'HTML',
      csv: 'CSV',
      xlsx: 'Excel',
    },
    tabs: {
      collections: 'Collections',
      fileStorage: 'File Storage',
      repositories: 'Repositories',
      dbConnections: 'Database',
    },
    filters: {
      all: 'All',
      personal: 'Personal',
      shared: 'Shared',
    },
    buttons: {
      newCollection: 'New Collection',
      newStorage: 'New File Storage',
      newRepository: 'New Repository',
      newConnection: 'New Connection',
      viewAllGraphs: 'View All Graphs',
      uploadHistory: 'Upload History',
      refresh: 'Refresh',
    },
    collections: {
      empty: { title: 'No collections', description: 'Create a new collection' },
      documents: 'documents',
      shared: 'Shared',
    },
    fileStorage: {
      empty: { title: 'No file storages', description: 'Create a new file storage' },
      files: 'files',
    },
    repositories: {
      empty: { title: 'No repositories', description: 'Add a new repository' },
      syncNow: 'Sync',
      lastSync: 'Last sync',
      active: 'Active',
      inactive: 'Inactive',
    },
    dbConnections: {
      empty: { title: 'No database connections', description: 'Add a new connection' },
      testConnection: 'Test Connection',
      connected: 'Connected',
      failed: 'Failed',
    },
  },
};
