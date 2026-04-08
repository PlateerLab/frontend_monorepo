import type { TranslationData } from '@xgen/i18n';

export const en: TranslationData = {
  chat: {
    inputPlaceholder: 'Enter your message...',
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
    sessionStarted: '{{agentflowName}} agentflow has started',
    emptyState: {
      title: 'Start your first conversation!',
      ready: 'agentflow is ready'
    },
    suggestions: {
      hello: 'Hello!',
      help: 'I need help',
      features: 'What features are available?'
    },
    error: {
      noSession: 'No active chat session',
      executionFailed: 'An error occurred during execution'
    }
  }
};
