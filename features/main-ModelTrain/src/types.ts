// Model Training types

export type TrainingStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type ModelType = 'classification' | 'regression' | 'nlp' | 'vision' | 'multimodal';

export interface TrainingJob {
  id: string;
  name: string;
  baseModel: string;
  modelType: ModelType;
  status: TrainingStatus;
  progress: number;
  epochs: number;
  currentEpoch: number;
  learningRate: number;
  batchSize: number;
  dataset: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  metrics?: TrainingMetrics;
}

export interface TrainingMetrics {
  loss: number;
  accuracy: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
}

export interface TrainingConfig {
  baseModel: string;
  modelType: ModelType;
  dataset: string;
  epochs: number;
  learningRate: number;
  batchSize: number;
  validationSplit: number;
  earlyStopping: boolean;
  checkpointFrequency: number;
}

export interface TrainingFilter {
  status?: TrainingStatus;
  modelType?: ModelType;
  dateRange?: { start: string; end: string };
}
