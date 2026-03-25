import type { TranslationData } from '@xgen/i18n';

export const en: TranslationData = {
  modelEval: {
    title: 'Model Evaluation',
    searchPlaceholder: 'Search evaluations...',
    newEvaluation: 'New Evaluation',
    tabs: { all: 'All', running: 'Running', completed: 'Completed' },
    status: { running: 'Running', completed: 'Completed', failed: 'Failed' },
    compareModels: 'Compare Models',
    exportReport: 'Export Report',
    confusionMatrix: 'Confusion Matrix',
    evaluationInProgress: 'Evaluation in progress...',
    empty: { title: 'No evaluations', description: 'Start a new evaluation' }
  }
};
