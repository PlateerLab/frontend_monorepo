export interface ConfigItem {
  env_name: string;
  config_path: string;
  current_value: unknown;
  default_value: unknown;
  is_saved: boolean;
  type: string;
}

export type CategoryType =
  | 'database'
  | 'openai'
  | 'app'
  | 'workflow'
  | 'node'
  | 'vectordb'
  | 'gemini'
  | 'anthropic'
  | 'aws'
  | 'vision_language'
  | 'other';
