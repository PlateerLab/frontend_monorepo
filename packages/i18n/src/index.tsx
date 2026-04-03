'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';

// Types
export type { Locale, TranslationData, TranslationBundle, LanguageContextType } from './types';
import type { Locale, LanguageContextType } from './types';

// Registry
export {
  registerTranslations,
  registerTranslationBundle,
  getTranslation,
  getAllTranslations,
  isNamespaceRegistered,
  getRegisteredNamespaces,
  addTranslationListener,
  clearTranslations,
} from './registry';
import {
  getTranslation,
  registerTranslationBundle,
  addTranslationListener,
} from './registry';

// Common translations
import { commonKo } from './locales/common-ko';
import { commonEn } from './locales/common-en';

// Extended translations (JSON)
import koJson from './locales/ko.json';
import enJson from './locales/en.json';

// ─────────────────────────────────────────────────────────────
// 초기화: 공통 번역 등록
// ─────────────────────────────────────────────────────────────

// 공통 번역 자동 등록
registerTranslationBundle('common', { ko: commonKo.common, en: commonEn.common });
registerTranslationBundle('toast', { ko: commonKo.toast, en: commonEn.toast });
registerTranslationBundle('sidebar', { ko: commonKo.sidebar, en: commonEn.sidebar });
registerTranslationBundle('header', { ko: commonKo.header, en: commonEn.header });

// Admin 번역 등록
if (koJson.admin && enJson.admin) {
  registerTranslationBundle('admin', { ko: koJson.admin as any, en: enJson.admin as any });
}

// ─────────────────────────────────────────────────────────────
// Context & Provider
// ─────────────────────────────────────────────────────────────

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LOCALE_STORAGE_KEY = 'xgen-locale';
const DEFAULT_LOCALE: Locale = 'en';

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [isHydrated, setIsHydrated] = useState(false);
  const [, forceUpdate] = useState(0);

  // hydration 이후 localStorage에서 저장된 locale 복원
  useEffect(() => {
    const savedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
    if (savedLocale === 'ko' || savedLocale === 'en') {
      setLocaleState(savedLocale);
    }
    setIsHydrated(true);
  }, []);

  // 번역 변경 리스너 - 새 번역이 등록되면 리렌더링
  useEffect(() => {
    const unsubscribe = addTranslationListener(() => {
      forceUpdate((n) => n + 1);
    });
    return unsubscribe;
  }, []);

  // 언어 변경 함수
  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    }
  }, []);

  // 번역 함수
  const t = useCallback(
    (key: string, vars?: Record<string, unknown>): string => {
      return getTranslation(locale, key, vars);
    },
    [locale]
  );

  const contextValue = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      isHydrated,
    }),
    [locale, setLocale, t, isHydrated]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────

/**
 * 번역 훅
 * @returns { t, locale, setLocale, isHydrated }
 */
export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};

/**
 * 간단한 locale 접근용 훅
 */
export const useLocale = (): { locale: Locale; setLocale: (locale: Locale) => void } => {
  const { locale, setLocale } = useTranslation();
  return { locale, setLocale };
};

// ─────────────────────────────────────────────────────────────
// Feature 번역 등록 헬퍼
// ─────────────────────────────────────────────────────────────

/**
 * Feature의 번역을 등록하는 헬퍼 함수
 * 각 feature에서 초기화 시 호출
 *
 * @example
 * ```ts
 * // features/main-AuthProfile/src/locales/index.ts
 * import { registerFeatureTranslations } from '@xgen/i18n';
 * import { ko } from './ko';
 * import { en } from './en';
 *
 * registerFeatureTranslations('authProfile', { ko, en });
 * ```
 */
export function registerFeatureTranslations(
  namespace: string,
  bundle: { ko: Record<string, unknown>; en: Record<string, unknown> }
): void {
  registerTranslationBundle(namespace, {
    ko: bundle.ko as Record<string, unknown>,
    en: bundle.en as Record<string, unknown>,
  });
}
