import { registerFeatureTranslations } from '@xgen/i18n';
import { ko } from './ko';
import { en } from './en';

// Dashboard 번역 등록
registerFeatureTranslations('dashboard', { ko, en });

export { ko, en };
