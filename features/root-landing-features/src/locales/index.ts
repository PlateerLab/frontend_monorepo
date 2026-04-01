import { registerFeatureTranslations } from '@xgen/i18n';
import { ko } from './ko';
import { en } from './en';

registerFeatureTranslations('features', { ko: ko.features as Record<string, unknown>, en: en.features as Record<string, unknown> });

export { ko, en };
