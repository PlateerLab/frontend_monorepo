import { registerFeatureTranslations } from '@xgen/i18n';
import { ko } from './ko';
import { en } from './en';

registerFeatureTranslations('hero', { ko: ko.hero as Record<string, unknown>, en: en.hero as Record<string, unknown> });
registerFeatureTranslations('mockup', { ko: ko.mockup as Record<string, unknown>, en: en.mockup as Record<string, unknown> });

export { ko, en };
