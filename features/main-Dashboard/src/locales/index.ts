import { registerFeatureTranslations } from '@xgen/i18n';
import { ko } from './ko';
import { en } from './en';

// Dashboard 번역 등록
registerFeatureTranslations('dashboard', { ko: ko.dashboard as Record<string, unknown>, en: en.dashboard as Record<string, unknown> });

export { ko, en };
