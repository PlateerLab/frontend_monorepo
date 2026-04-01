import { registerFeatureTranslations } from '@xgen/i18n';
import { ko } from './ko';
import { en } from './en';

registerFeatureTranslations('workflowIntro', { ko: ko.workflowIntro as Record<string, unknown>, en: en.workflowIntro as Record<string, unknown> });

export { ko, en };
