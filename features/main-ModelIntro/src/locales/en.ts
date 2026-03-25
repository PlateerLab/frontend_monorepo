import type { TranslationData } from '@xgen/i18n';

export const en: TranslationData = {
  modelIntro: {
    title: 'Models',
    hero: {
      title: 'Model Hub',
      subtitle: 'Train, evaluate, and manage AI models',
      startTraining: 'Start Training',
      browseModels: 'Browse Models'
    },
    capabilities: 'Key Capabilities',
    features: {
      train: { title: 'Model Training', description: 'Train custom models' },
      eval: { title: 'Model Evaluation', description: 'Evaluate model performance' },
      storage: { title: 'Model Storage', description: 'Store and manage models' },
      metrics: { title: 'Model Metrics', description: 'Real-time performance monitoring' }
    },
    stats: {
      trainedModels: 'Trained Models',
      pretrainedModels: 'Pre-trained Models',
      accuracy: 'Average Accuracy',
      monitoring: 'Real-time Monitoring'
    }
  }
};
