import { registerFeatureTranslations } from '@xgen/i18n';
import { ko } from './ko';
import { en } from './en';

registerFeatureTranslations('hero', { ko, en });
registerFeatureTranslations('mockup', { ko, en });

export { ko, en };
