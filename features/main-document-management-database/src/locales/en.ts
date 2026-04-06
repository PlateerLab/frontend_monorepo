import type { TranslationData } from '@xgen/i18n';

export const en: TranslationData = {
  database: {
    searchPlaceholder: 'Search databases...',
    buttons: {
      newConnection: 'New Connection',
    },

    // ── Filters ──
    filters: {
      all: 'All',
      personal: 'Personal',
      shared: 'Shared',
    },

    // ── Status Badges ──
    badges: {
      active: 'Active',
      inactive: 'Inactive',
      success: 'Success',
      failed: 'Failed',
    },

    // ── Actions ──
    actions: {
      test: 'Test Connection',
      edit: 'Edit',
      activate: 'Activate',
      deactivate: 'Deactivate',
      share: 'Share Settings',
      documentation: 'Documentation',
      delete: 'Delete',
    },

    // ── Toast Messages ──
    toast: {
      createSuccess: 'Database connection created',
      createFailed: 'Failed to create database connection',
      updateSuccess: 'Database connection updated',
      updateFailed: 'Failed to update database connection',
      deleteSuccess: 'Database connection deleted',
      deleteFailed: 'Failed to delete database connection',
      activated: 'Database connection activated',
      deactivated: 'Database connection deactivated',
      toggleFailed: 'Failed to change status',
      testSuccess: 'Connection test successful',
      testFailed: 'Connection test failed {{message}}',
      shareEnabled: '{{name}} sharing enabled',
      shareDisabled: '{{name}} sharing disabled',
      shareFailed: 'Failed to update sharing settings',
    },

    // ── Create Modal ──
    createModal: {
      title: 'New Database Connection',
    },

    // ── Edit Modal ──
    editModal: {
      title: 'Edit Database Connection',
    },

    // ── Share Modal ──
    shareModal: {
      title: 'Share Settings',
      description: 'Change sharing settings for {{name}}',
      shared: 'Shared (accessible by others)',
      private: 'Private (only accessible by me)',
      save: 'Save',
      saving: 'Saving...',
    },

    // ── Form (shared Create/Edit) ──
    form: {
      connectionName: 'Connection Name',
      connectionNamePlaceholder: 'Enter connection name',
      description: 'Description',
      descriptionPlaceholder: 'Enter a description for this connection',
      customPassword: 'Custom Password',
      customPasswordPlaceholder: 'Enter custom password',
      customPasswordDesc: 'Set a separate access password for this connection',
      sectionConnection: 'Database Connection',
      dbType: 'Database Type',
      host: 'Host',
      hostPlaceholder: 'db.example.com',
      port: 'Port',
      database: 'Database',
      databasePlaceholder: 'Database name',
      schema: 'Schema',
      username: 'Username',
      usernamePlaceholder: 'Username',
      password: 'Password',
      passwordPlaceholder: 'Password',
      passwordUnchanged: 'Leave blank to keep unchanged',
      ssl: 'Use SSL',
      sslDesc: 'Use SSL/TLS encrypted connection',
      sectionSettings: 'Connection Settings',
      connectionTimeout: 'Connection Timeout (sec)',
      queryTimeout: 'Query Timeout (sec)',
      poolSize: 'Pool Size',
      maxOverflow: 'Max Overflow',
      sectionPolicy: 'Query Policy',
      readOnly: 'Read Only',
      readOnlyDesc: 'Connect in read-only mode (recommended)',
      maxRowsLimit: 'Max Rows',
      allowedTables: 'Allowed Tables',
      allowedTablesPlaceholder: 'Comma-separated (leave empty to allow all)',
      deniedTables: 'Denied Tables',
      deniedTablesPlaceholder: 'Comma-separated (leave empty to deny none)',
      create: 'Connect',
      creating: 'Connecting...',
      update: 'Update',
      updating: 'Updating...',
      cancel: 'Cancel',
    },

    // ── Error & Empty States ──
    error: {
      loadFailed: 'Failed to load DB connections',
    },
    empty: {
      title: 'No database connections',
      description: 'Add a new connection',
    },
  },
};
