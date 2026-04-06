import { registerFeatureTranslations } from '@xgen/i18n';
import { ko } from './ko';
import { en } from './en';

registerFeatureTranslations('admin', {
  ko: ko.admin as Record<string, unknown>,
  en: en.admin as Record<string, unknown>,
});

export { ko, en };
