// ─────────────────────────────────────────────────────────────
// i18n Types
// ─────────────────────────────────────────────────────────────

/** 지원 언어 */
export type Locale = 'ko' | 'en';

/** 중첩 번역 데이터 타입 */
export type NestedTranslation = string | string[] | { [key: string]: NestedTranslation };

/** 번역 데이터 맵 */
export type TranslationData = Record<string, NestedTranslation>;

/** 번역 번들 (ko/en 모두 포함) */
export interface TranslationBundle {
  ko: TranslationData;
  en: TranslationData;
}

/** 언어 컨텍스트 타입 */
export interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, varsOrFallback?: Record<string, unknown> | string) => string;
  isHydrated: boolean;
}
