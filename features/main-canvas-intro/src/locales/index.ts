import { registerFeatureTranslations } from '@xgen/i18n';
import { ko } from './ko';
import { en } from './en';

registerFeatureTranslations('canvasIntro', { ko: ko.canvasIntro as Record<string, unknown>, en: en.canvasIntro as Record<string, unknown> });

export { ko, en };
