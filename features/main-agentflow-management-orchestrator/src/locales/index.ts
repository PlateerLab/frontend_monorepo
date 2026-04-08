import { registerFeatureTranslations } from '@xgen/i18n';
import { ko } from './ko';
import { en } from './en';

// Agentflows 번역 등록
registerFeatureTranslations('agentflows', { ko, en });

export { ko, en };
