export interface ConfigItem {
  env_name: string;
  config_path: string;
  current_value: unknown;
  default_value: unknown;
  is_saved: boolean;
}

export interface FieldConfig {
  label: string;
  type: 'text' | 'password' | 'number' | 'boolean' | 'select';
  placeholder?: string;
  description: string;
  required: boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: string; label: string }>;
}
