import { registerFeatureTranslations } from '@xgen/i18n';
import { ko } from './ko';
import { en } from './en';

registerFeatureTranslations('chatIntro', { ko: ko.chatIntro as Record<string, unknown>, en: en.chatIntro as Record<string, unknown> });

export { ko, en };
