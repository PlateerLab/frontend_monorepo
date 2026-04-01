import type { TranslationData } from '@xgen/i18n';

export const en: TranslationData = {
  chat: {
    inputPlaceholder: 'Type a message...',
    send: 'Send',
    sendError: 'Failed to send message',
    retry: 'Retry',
    attach: 'Attach File',
    settings: 'Settings',
    viewHistory: 'View History',
    interactionCount: 'Interactions',
    currentChat: 'Current Chat',
    newChat: 'New Chat',
    startNewChat: 'Start New Chat',
    stop: 'Stop',
    cancelled: 'Cancelled',
    sessionStarted: '{{workflowName}} workflow has started',
    error: {
      noSession: 'No active chat session',
      executionFailed: 'An error occurred during execution'
    }
  }
};
