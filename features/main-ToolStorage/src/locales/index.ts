import { registerFeatureTranslations } from '@xgen/i18n';
import { ko } from './ko';
import { en } from './en';

registerFeatureTranslations('toolStorage', { ko: ko.toolStorage as Record<string, unknown>, en: en.toolStorage as Record<string, unknown> });

export { ko, en };
