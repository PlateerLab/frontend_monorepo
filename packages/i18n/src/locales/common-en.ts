import type { TranslationData } from '../types';

/**
 * Common translations (English)
 * - common: Common UI elements
 * - sidebar: Sidebar menu
 * - toast: Toast messages
 * - header: Header elements
 */
export const commonEn: TranslationData = {
  common: {
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    login: 'Login',
    logout: 'Logout',
    getStarted: 'Get Started',
    loading: 'Loading...',
    welcome: 'Welcome, {{username}}',
    mypage: 'Go to My Page',
    viewAll: 'View All',
    refresh: 'Refresh',
    retry: 'Retry',
    error: 'An error occurred',
    search: 'Search',
    filter: 'Filter',
    actions: 'Actions',
    more: 'More',
    yes: 'Yes',
    no: 'No',
    create: 'Create',
    update: 'Update',
    upload: 'Upload',
    download: 'Download',
    copy: 'Copy',
    share: 'Share',
    export: 'Export',
    import: 'Import',
  },
  toast: {
    logoutSuccess: 'Logged out successfully.',
    logoutError: 'An error occurred while logging out.',
    saveSuccess: 'Saved successfully.',
    saveError: 'Failed to save.',
    deleteSuccess: 'Deleted successfully.',
    deleteError: 'Failed to delete.',
    copySuccess: 'Copied successfully.',
    copyError: 'Failed to copy.',
    uploadSuccess: 'Uploaded successfully.',
    uploadError: 'Failed to upload.',
    downloadSuccess: 'Downloaded successfully.',
    downloadError: 'Failed to download.',
  },
  sidebar: {
    userMode: 'User mode',
    adminMode: 'Admin',
    myPageMode: 'My Page',
    openSidebar: 'Open Sidebar',
    closeSidebar: 'Close Sidebar',
    chat: {
      title: 'Chat',
      intro: { title: 'Chat Introduction' },
      history: { title: 'Chat History' },
      new: { title: 'New Chat' },
      current: { title: 'Current Chat' },
    },
    workflow: {
      title: 'Workflow',
      intro: { title: 'Workflow Introduction' },
      canvas: { title: 'Canvas' },
      workflows: { title: 'Workflows' },
      tools: { title: 'API Tool' },
      prompts: { title: 'Prompt' },
      authProfile: { title: 'Auth Profile', description: 'Manage API authentication' },
    },
    knowledge: {
      title: 'Knowledge',
      collections: { title: 'Document Management' },
      uploadHistory: { title: 'Upload History', description: 'Document upload processing history' },
    },
    model: {
      title: 'Model',
      intro: { title: 'Model Introduction' },
      train: { title: 'Model Training' },
      eval: { title: 'Model Evaluation' },
      storage: { title: 'Model Storage' },
      metrics: { title: 'Model Metrics' },
    },
    ml: {
      title: 'ML',
      intro: { title: 'ML Introduction' },
      train: { title: 'ML Training' },
      hub: { title: 'ML Hub' },
    },
    data: {
      title: 'Data',
      intro: { title: 'Data Introduction' },
      station: { title: 'Data Station' },
      storage: { title: 'Data Storage' },
    },
    support: {
      title: 'Support',
      request: { title: 'Service Request' },
      faq: { title: 'FAQ' },
    },
    workspace: {
      title: 'Workspace',
      mainDashboard: { title: 'Dashboard', description: 'Main Dashboard' },
    },
  },
  header: {
    title: 'GEN AI Platform',
  },
};
