import { registerFeatureTranslations } from '@xgen/i18n';
import { ko } from './ko';
import { en } from './en';

registerFeatureTranslations('chatNew', { ko: ko.chatNew as Record<string, unknown>, en: en.chatNew as Record<string, unknown> });

export { ko, en };
