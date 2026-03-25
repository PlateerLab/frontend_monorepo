import type { TranslationData } from '@xgen/i18n';

export const en: TranslationData = {
  modelTrain: {
    title: 'Model Training',
    searchPlaceholder: 'Search training jobs...',
    newTraining: 'New Training',
    tabs: { all: 'All', running: 'Running', completed: 'Completed', failed: 'Failed' },
    status: {
      pending: 'Pending',
      running: 'Running',
      completed: 'Completed',
      failed: 'Failed',
      cancelled: 'Cancelled'
    },
    start: 'Start',
    stop: 'Stop',
    retry: 'Retry',
    viewResults: 'View Results',
    createdAt: 'Created',
    empty: { title: 'No training jobs', description: 'Start a new training' }
  }
};
