import { registerFeatureTranslations } from '@xgen/i18n';
import { ko } from './ko';
import { en } from './en';

registerFeatureTranslations('chat', { ko: ko.chat as Record<string, unknown>, en: en.chat as Record<string, unknown> });

export { ko, en };
