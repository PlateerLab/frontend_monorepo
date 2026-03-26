import { registerFeatureTranslations } from '@xgen/i18n';
import { ko } from './ko';
import { en } from './en';

// Workflows 번역 등록
registerFeatureTranslations('workflows', { ko, en });

export { ko, en };
