import { registerFeatureTranslations } from '@xgen/i18n';
import { ko } from './ko';
import { en } from './en';

registerFeatureTranslations('cta', { ko: ko.cta as Record<string, unknown>, en: en.cta as Record<string, unknown> });

export { ko, en };
