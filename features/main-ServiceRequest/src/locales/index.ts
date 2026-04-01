import { registerFeatureTranslations } from '@xgen/i18n';
import { ko } from './ko';
import { en } from './en';

registerFeatureTranslations('serviceRequest', { ko: ko.serviceRequest as Record<string, unknown>, en: en.serviceRequest as Record<string, unknown> });

export { ko, en };
