import type { TranslationData } from '@xgen/i18n';

export const en: TranslationData = {
  chatHistory: {
    title: 'Chat History',
    description: 'View and manage your previous chat sessions',
    searchPlaceholder: 'Search chats...',
    filter: { all: 'All', active: 'Active', deleted: 'Deleted', deploy: 'Deployed' },
    interactions: 'Interactions',
    continue: 'Continue',
    delete: 'Delete',
    deleted: 'Deleted',
    deploy: 'Deployed',
    yesterday: 'Yesterday',
    empty: {
      title: 'No chat history',
      description: 'Start a new conversation',
      action: 'Start New Chat'
    },
    error: {
      loadFailed: 'Failed to load chat history',
      workflowDeleted: 'Workflow has been deleted',
      saveFailed: 'Failed to save',
      deleteFailed: 'Failed to delete'
    }
  }
};
