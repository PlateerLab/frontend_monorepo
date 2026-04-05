import type { TranslationData } from '@xgen/i18n';

export const en: TranslationData = {
  database: {
    searchPlaceholder: 'Search databases...',
    buttons: {
      newConnection: 'New Connection',
    },
    createModal: {
      title: 'New Database Connection',
      connectionName: 'Connection Name',
      connectionNamePlaceholder: 'Enter connection name',
      dbType: 'Database Type',
      host: 'Host',
      hostPlaceholder: 'db.example.com',
      port: 'Port',
      database: 'Database',
      databasePlaceholder: 'Database name',
      username: 'Username',
      usernamePlaceholder: 'Username',
      password: 'Password',
      passwordPlaceholder: 'Password',
      ssl: 'Use SSL',
      sslDesc: 'Use SSL/TLS encrypted connection',
      readOnly: 'Read Only',
      readOnlyDesc: 'Connect in read-only mode (recommended)',
      create: 'Connect',
      creating: 'Connecting...',
      cancel: 'Cancel',
    },
    error: {
      loadFailed: 'Failed to load DB connections',
    },
    empty: {
      title: 'No database connections',
      description: 'Add a new connection',
    },
    shared: 'Shared',
    testConnection: 'Test Connection',
    connected: 'Connected',
    failed: 'Failed',
  },
};
