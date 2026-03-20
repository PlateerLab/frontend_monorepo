'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import type { Locale } from '@xgen/types';

type NestedTranslation = string | string[] | { [key: string]: NestedTranslation };
type TranslationData = Record<string, NestedTranslation>;

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, unknown>) => string;
  isHydrated: boolean;
}

import koTranslations from './locales/ko.json';
import enTranslations from './locales/en.json';

const translations: Record<Locale, TranslationData> = {
  ko: koTranslations as TranslationData,
  en: enTranslations as TranslationData,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const LOCALE_STORAGE_KEY = 'xgen-locale';
const DEFAULT_LOCALE: Locale = 'en';

interface LanguageProviderProps {
  children: ReactNode;
  extraTranslations?: Record<Locale, TranslationData>;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children, extraTranslations }) => {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [isHydrated, setIsHydrated] = useState(false);

  const mergedTranslations = useMemo(() => {
    if (!extraTranslations) return translations;
    return {
      ko: { ...translations.ko, ...extraTranslations.ko },
      en: { ...translations.en, ...extraTranslations.en },
    };
  }, [extraTranslations]);

  useEffect(() => {
    const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
    if (saved === 'ko' || saved === 'en') setLocaleState(saved);
    setIsHydrated(true);
  }, []);

  const setLocale = useCallback((v: Locale) => {
    setLocaleState(v);
    localStorage.setItem(LOCALE_STORAGE_KEY, v);
  }, []);

  const t = useCallback((key: string, vars?: Record<string, unknown>): string => {
    const keys = key.split('.');
    let value: unknown = mergedTranslations[locale];
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) value = (value as Record<string, unknown>)[k];
      else return key;
    }
    if (typeof value !== 'string') return key;
    if (vars) return value.replace(/\{\{(\w+)\}\}/g, (_, n) => n in vars ? String(vars[n]) : `{{${n}}}`);
    return value;
  }, [locale, mergedTranslations]);

  const ctx = useMemo(() => ({ locale, setLocale, t, isHydrated }), [locale, setLocale, t, isHydrated]);
  return <LanguageContext.Provider value={ctx}>{children}</LanguageContext.Provider>;
};

export const useTranslation = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useTranslation must be used within LanguageProvider');
  return ctx;
};

export const useI18n = useTranslation;
export const languages = { ko: { name: '한국어', code: 'KOR' }, en: { name: 'English', code: 'ENG' } };
export type { LanguageContextType };
