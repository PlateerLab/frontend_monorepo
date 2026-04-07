import type { CategoryType } from './types';

/** i18n prefix for this feature */
export const CV = 'admin.settings.configViewer';

/** Display order for category filter tabs */
export const CATEGORY_ORDER: CategoryType[] = [
  'node', 'workflow', 'app', 'database', 'vectordb',
  'openai', 'gemini', 'anthropic', 'aws', 'vision_language',
];

/** Env-name substrings that indicate a sensitive value */
export const SENSITIVE_FIELDS = ['API_KEY', 'PASSWORD', 'SECRET', 'TOKEN'];
