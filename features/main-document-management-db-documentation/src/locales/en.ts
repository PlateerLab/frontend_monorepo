import type { TranslationData } from '@xgen/i18n';

export const en: TranslationData = {
  dbDocumentation: {
    // ── Sub-tabs ──
    subTab: {
      connections: 'Connections',
      documentation: 'Documentation',
    },

    // ── Status ──
    status: {
      draft: 'Draft',
      pending: 'Pending',
      active: 'Active',
      paused: 'Paused',
      completed: 'Completed',
      failed: 'Failed',
      cancelled: 'Cancelled',
    },

    // ── Schedule Type ──
    scheduleType: {
      once: 'Once',
      interval: 'Interval',
      daily: 'Daily',
      weekly: 'Weekly',
      cron: 'Cron',
    },

    // ── List view ──
    loading: 'Loading documentation jobs...',
    loadError: 'Failed to load documentation jobs',
    retry: 'Retry',
    refresh: 'Refresh',
    createNew: 'New Documentation Job',
    emptyTitle: 'No documentation jobs',
    emptyDescription: 'Create a job to extract data from DB and store in a vector collection',

    // ── Card ──
    card: {
      total: 'Total',
      success: 'Success',
      failed: 'Failed',
    },

    // ── Actions ──
    actions: {
      edit: 'Edit',
      start: 'Start',
      startSuccess: 'Job started',
      pause: 'Pause',
      pauseSuccess: 'Job paused',
      resume: 'Resume',
      resumeSuccess: 'Job resumed',
      cancel: 'Cancel',
      cancelSuccess: 'Job cancelled',
      executeNow: 'Execute Now',
      executeSuccess: 'Job executed',
      delete: 'Delete',
      deleteConfirmTitle: 'Delete Documentation Job',
      deleteConfirmMessage: 'Delete job "{{name}}"?',
      deleteConfirm: 'Delete',
      deleteCancel: 'Cancel',
      deleteSuccess: 'Job deleted',
      deleteFailed: 'Failed to delete job',
      error: 'Action failed',
    },

    // ── Editor ──
    editor: {
      createTitle: 'New Documentation Job',
      editTitle: 'Edit Documentation Job',
      back: 'Back',
      cancel: 'Cancel',
      save: 'Save',
      saving: 'Saving...',
      saved: 'Documentation job saved',
      saveError: 'Failed to save',

      basicInfo: 'Basic Information',
      jobName: 'Job Name',
      jobNamePlaceholder: 'Enter job name',
      nameRequired: 'Job name is required',
      targetCollection: 'Target Collection',
      selectCollectionPlaceholder: 'Select a collection',
      loadingCollections: 'Loading collections...',
      collectionRequired: 'Target collection is required',
      description: 'Description',
      descriptionPlaceholder: 'Description (optional)',

      querySection: 'DB Connection & Query',
      selectConnection: 'DB Connection',
      selectConnectionPlaceholder: 'Select a DB connection',
      connectionRequired: 'DB connection is required',
      query: 'SQL Query',
      queryPlaceholder: 'SELECT * FROM table_name LIMIT 100',
      queryRequired: 'SQL query is required',
      runQuery: 'Run Query',
      running: 'Running...',
      queryResult: 'Query Results',
      resultCount: '{{count}} rows returned',
      rows: 'rows',
      noResults: 'No results',
      queryError: 'Query execution failed',

      scheduleSection: 'Schedule Settings',
      scheduleType: 'Schedule Type',
      startTime: 'Start Time',
      intervalSeconds: 'Interval (seconds)',
      hour: 'Hour',
      minute: 'Minute',
      weekdays: 'Weekdays',
      cronExpression: 'Cron Expression',
      endTime: 'End Time',
      maxExecutions: 'Max Executions',
      unlimited: 'Unlimited',

      advancedOptions: 'Advanced Options',
      autoStart: 'Auto-start after save',
    },

    // ── Detail Modal ──
    detail: {
      basicInfo: 'Basic Information',
      jobName: 'Job Name',
      description: 'Description',
      status: 'Status',
      owner: 'Owner',

      dbSection: 'DB Connection & Query',
      connection: 'DB Connection',
      collection: 'Target Collection',
      query: 'Query',

      scheduleSection: 'Schedule Settings',
      scheduleType: 'Schedule Type',
      cronExpression: 'Cron Expression',
      interval: 'Interval',
      intervalUnit: 'sec',
      runTime: 'Run Time',
      maxExecutions: 'Max Executions',
      maxExecutionsUnit: 'times',

      statsSection: 'Execution Statistics',
      totalExecutions: 'Total Executions',
      successfulExecutions: 'Successful',
      failedExecutions: 'Failed',
      lastExecution: 'Last Execution',
      nextExecution: 'Next Execution',

      timeSection: 'Time Info',
      createdAt: 'Created',
      updatedAt: 'Updated',

      logsSection: 'Recent Execution Logs',
      logsLoading: 'Loading logs...',
      noLogs: 'No execution logs',
      logSuccess: 'Success',
      logFailed: 'Failed',

      edit: 'Edit',
      close: 'Close',
    },
  },
};
