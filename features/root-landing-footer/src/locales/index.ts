import { registerFeatureTranslations } from '@xgen/i18n';
import { ko } from './ko';
import { en } from './en';

registerFeatureTranslations('footer', { ko: ko.footer as Record<string, unknown>, en: en.footer as Record<string, unknown> });

export { ko, en };
