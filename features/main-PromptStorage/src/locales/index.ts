import { registerFeatureTranslations } from '@xgen/i18n';
import { ko } from './ko';
import { en } from './en';

registerFeatureTranslations('promptStorage', { ko: ko.promptStorage as Record<string, unknown>, en: en.promptStorage as Record<string, unknown> });

export { ko, en };
