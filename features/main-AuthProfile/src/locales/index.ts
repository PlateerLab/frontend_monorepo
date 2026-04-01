import { registerFeatureTranslations } from '@xgen/i18n';
import { ko } from './ko';
import { en } from './en';

// Auth Profile 번역 등록
registerFeatureTranslations('authProfile', { ko, en });

export { ko, en };
