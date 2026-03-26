import type { TranslationData } from '@xgen/i18n';

export const en: TranslationData = {
  title: 'Workflows',
  description: 'Manage and execute your workflows',
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
    loadingAuth: 'Loading authentication...',
  },
  error: {
    title: 'Error',
    loadFailed: 'Failed to load workflows',
    noDeletePermission: 'No permission to delete',
  },
  buttons: {
    retry: 'Retry',
    multiSelectEnable: 'Multi-select',
    multiSelectDisable: 'Cancel selection',
    deleteSelected: 'Delete selected',
  },
  badges: {
    live: 'LIVE',
    draft: 'DRAFT',
    archived: 'ARCHIVED',
    disabled: 'DISABLED',
    shared: 'SHARED',
    my: 'MY',
    deployed: 'DEPLOYED',
    pending: 'PENDING',
    close: 'CLOSE',
  },
  card: {
    organization: 'Organization',
    nodes: '{{count}} nodes',
  },
  empty: {
    title: 'No workflows',
    description: 'Create a new workflow to get started',
    action: 'Create new workflow',
  },
  // Store
  store: {
    title: 'Workflow Store',
    searchPlaceholder: 'Search workflows...',
    filter: {
      all: 'All',
      my: 'My Workflows',
      template: 'Templates',
      shared: 'Shared',
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
      searchDescription: 'No results for "{{term}}"',
      action: 'Upload workflow',
    },
    messages: {
      downloadSuccess: 'Workflow downloaded from store',
      uploadSuccess: 'Uploaded to store',
    },
    card: {
      noDescription: 'No description',
      noRating: 'No rating',
    },
    error: {
      title: 'Error',
      loadFailed: 'Failed to load store',
    },
    buttons: {
      retry: 'Retry',
    },
    upload: 'Upload',
    refresh: 'Refresh',
    loading: 'Loading store...',
    uploadModal: {
      title: 'Upload to Store',
      description: 'Select a workflow to share to the store',
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
      failed: 'Failed',
    },
    createNew: 'New Schedule',
    empty: {
      title: 'No schedules',
      description: 'Set up workflow execution schedules',
      action: 'Create new schedule',
    },
    fields: {
      schedule: 'Schedule',
      nextRun: 'Next Run',
      lastRun: 'Last Run',
      runCount: 'Run Count',
    },
    frequency: {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      cron: 'Cron',
      interval: 'Interval',
      once: 'Once',
      hourly: 'Hourly',
    },
    actions: {
      pause: 'Pause',
      resume: 'Resume',
      edit: 'Edit',
      delete: 'Delete',
      runNow: 'Run Now',
    },
    confirm: {
      delete: 'Delete schedule "{{name}}"?',
    },
    card: {
      noDescription: 'No description',
    },
    messages: {
      pauseSuccess: 'Schedule paused',
      resumeSuccess: 'Schedule resumed',
      runSuccess: 'Schedule executed',
    },
    error: {
      title: 'Error',
      loadFailed: 'Failed to load schedules',
    },
    buttons: {
      retry: 'Retry',
    },
    create: 'New Schedule',
    refresh: 'Refresh',
    loading: 'Loading schedules...',
    createModal: {
      title: 'Create Schedule',
      description: 'Set up a workflow execution schedule',
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
      running: 'Running',
      completed: 'Completed',
      error: 'Error',
    },
    empty: {
      title: 'No test history',
      description: 'Select a workflow to start testing',
      action: 'Start new test',
    },
    actions: {
      runTest: 'Run Test',
      viewLogs: 'View Logs',
      cancel: 'Cancel',
      delete: 'Delete',
    },
    fields: {
      input: 'Input',
      output: 'Output',
      duration: 'Duration',
      status: 'Status',
    },
    status: {
      idle: 'Idle',
      success: 'Success',
      failed: 'Failed',
      running: 'Running',
    },
    steps: {
      selectWorkflow: 'Select Workflow',
      selectWorkflowDesc: 'Choose a workflow to test',
      uploadFile: 'Upload File',
      uploadFileDesc: 'Upload an Excel file containing test data',
      runTest: 'Run Test',
      runTestDesc: 'Execute the batch test and review results',
    },
    newTest: 'New Test',
    refresh: 'Refresh',
    loading: 'Loading tester...',
    error: {
      title: 'Error',
      loadFailed: 'Failed to load test list',
    },
    buttons: {
      retry: 'Retry',
    },
    create: {
      title: 'Create Batch Test',
      uploadPrompt: 'Drag or click to upload an Excel file',
      uploadHint: 'Only .xlsx and .xls files are supported',
      selectWorkflow: 'Select Workflow',
      selectPlaceholder: 'Choose a workflow',
      start: 'Start Test',
    },
  },
};
