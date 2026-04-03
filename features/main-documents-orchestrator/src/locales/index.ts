import { registerFeatureTranslations } from '@xgen/i18n';
import { ko } from './ko';
import { en } from './en';

registerFeatureTranslations('documents', { ko: ko.documents as Record<string, unknown>, en: en.documents as Record<string, unknown> });

export { ko, en };
