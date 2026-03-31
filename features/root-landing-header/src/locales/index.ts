import { registerFeatureTranslations } from '@xgen/i18n';
import { ko } from './ko';
import { en } from './en';

registerFeatureTranslations('header', { ko, en });
registerFeatureTranslations('common', { ko, en });

export { ko, en };
