import { registerFeatureTranslations } from '@xgen/i18n';
import { ko } from './ko';
import { en } from './en';

registerFeatureTranslations('header', { ko: ko.header as Record<string, unknown>, en: en.header as Record<string, unknown> });
registerFeatureTranslations('common', { ko: ko.common as Record<string, unknown>, en: en.common as Record<string, unknown> });

export { ko, en };
