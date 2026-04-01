import { registerFeatureTranslations } from '@xgen/i18n';
import { ko } from './ko';
import { en } from './en';

registerFeatureTranslations('faq', { ko: ko.faq as Record<string, unknown>, en: en.faq as Record<string, unknown> });

export { ko, en };
