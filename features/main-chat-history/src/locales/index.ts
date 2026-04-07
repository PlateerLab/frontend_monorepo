import { registerFeatureTranslations } from '@xgen/i18n';
import { ko } from './ko';
import { en } from './en';

registerFeatureTranslations('chatHistory', { ko: ko.chatHistory as Record<string, unknown>, en: en.chatHistory as Record<string, unknown> });

export { ko, en };
