import type { TranslationData } from '@xgen/i18n';

export const en: TranslationData = {
  chatIntro: {
    heroTitle: 'Chat with AI',
    heroDescription: 'Ask questions naturally and get instant answers',
    startNewChat: 'Start New Chat',
    viewHistory: 'View History',
    features: {
      naturalLanguage: {
        title: 'Natural Language Processing',
        description: 'Converse naturally with AI using everyday language'
      },
      contextSearch: {
        title: 'Context Search',
        description: 'Understands conversation context and searches relevant information'
      },
      toolIntegration: {
        title: 'Tool Integration',
        description: 'Performs tasks by integrating with various tools'
      }
    },
    quickStart: {
      title: 'Quick Start',
      step1: { title: 'Select Workflow', description: 'Choose an AI workflow to use' },
      step2: { title: 'Ask Question', description: 'Enter your question in natural language' },
      step3: { title: 'Get Answer', description: 'Check the AI-generated response' }
    },
    additionalFeatures: {
      title: 'Additional Features',
      history: { title: 'Chat History', description: 'Review previous conversations anytime' },
      multimodal: { title: 'Multimodal', description: 'Use text, images, and files together' },
      workflow: { title: 'Workflow Integration', description: 'Run workflows directly from chat' }
    }
  }
};
