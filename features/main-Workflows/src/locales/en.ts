import type { TranslationData } from '@xgen/i18n';

export const en: TranslationData = {
  title: 'Workflows',
  tabs: {
    storage: 'Storage',
    store: 'Store',
    scheduler: 'Scheduler',
    tester: 'Tester',
  },
  filter: {
    all: 'All',
    active: 'Active',
    archived: 'Archived',
    unactive: 'Inactive',
    personal: 'Personal',
    shared: 'Shared',
  },
  actions: {
    execute: 'Execute',
    edit: 'Edit',
    copy: 'Duplicate',
    delete: 'Delete',
    logs: 'Logs',
    settings: 'Settings',
    deployInfo: 'Deploy Info',
    deploySettings: 'Deploy Settings',
    versions: 'Version History',
    createNew: 'New Workflow',
  },
  confirm: {
    delete: 'Delete workflow "{{name}}"?',
    bulkDelete: 'Delete {{count}} workflow(s)?',
  },
  messages: {
    readOnly: 'This workflow is read-only',
    unactive: 'This workflow is inactive',
  },
  error: {
    loadFailed: 'Failed to load workflows',
    noDeletePermission: 'No permission to delete',
  },
  card: {
    organization: 'Organization',
    nodes: 'nodes',
  },
  empty: {
    title: 'No workflows',
    description: 'Create a new workflow to get started',
  },
  // Store
  store: {
    title: 'Workflow Store',
    searchPlaceholder: 'Search workflows...',
    filter: {
      all: 'All',
      my: 'My Workflows',
    },
    addCard: {
      title: 'Add to Store',
      description: 'Share your workflow to the store',
    },
    allTags: 'All Tags',
    actions: {
      download: 'Download',
      delete: 'Delete',
    },
    empty: {
      title: 'No workflows in store',
      description: 'Share your workflows',
    },
    messages: {
      downloadSuccess: 'Workflow downloaded from store',
      uploadSuccess: 'Uploaded to store',
    },
  },
  // Scheduler
  scheduler: {
    title: 'Workflow Scheduler',
    searchPlaceholder: 'Search schedules...',
    filter: {
      all: 'All',
      active: 'Active',
      paused: 'Paused',
      completed: 'Completed',
    },
    createNew: 'New Schedule',
    empty: {
      title: 'No schedules',
      description: 'Set up workflow execution schedules',
    },
    fields: {
      schedule: 'Schedule',
      nextRun: 'Next Run',
      lastRun: 'Last Run',
      runCount: 'Run Count',
    },
    actions: {
      pause: 'Pause',
      resume: 'Resume',
      edit: 'Edit',
      delete: 'Delete',
      runNow: 'Run Now',
    },
    messages: {
      pauseSuccess: 'Schedule paused',
      resumeSuccess: 'Schedule resumed',
      runSuccess: 'Schedule executed',
    },
  },
  // Tester
  tester: {
    title: 'Workflow Tester',
    selectWorkflow: 'Select a workflow to test',
    searchPlaceholder: 'Search workflows...',
    filter: {
      all: 'All',
      recent: 'Recent Tests',
    },
    empty: {
      title: 'No test history',
      description: 'Select a workflow to start testing',
    },
    actions: {
      runTest: 'Run Test',
      viewLogs: 'View Logs',
    },
    fields: {
      input: 'Input',
      output: 'Output',
      duration: 'Duration',
      status: 'Status',
    },
    status: {
      success: 'Success',
      failed: 'Failed',
      running: 'Running',
    },
  },
};
