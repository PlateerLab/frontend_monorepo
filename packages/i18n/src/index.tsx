'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';

// 지원 언어 타입
export type Locale = 'ko' | 'en';

// 번역 데이터 타입 (중첩 구조 및 배열 지원)
type NestedTranslation = string | string[] | { [key: string]: NestedTranslation };
type TranslationData = Record<string, NestedTranslation>;

// 언어 컨텍스트 타입
interface LanguageContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string, vars?: Record<string, unknown>) => string;
    isHydrated: boolean;
}

// 번역 파일 import
import koTranslations from './locales/ko.json';
import enTranslations from './locales/en.json';

const translations: Record<Locale, TranslationData> = {
    ko: koTranslations as TranslationData,
    en: enTranslations as TranslationData,
};

// 컨텍스트 생성
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// localStorage 키
const LOCALE_STORAGE_KEY = 'xgen-locale';

// SSR과 클라이언트 초기 렌더가 동일하도록 항상 기본 locale('en')로 시작
const DEFAULT_LOCALE: Locale = 'en';

// Provider 컴포넌트
interface LanguageProviderProps {
    children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
    const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
    const [isHydrated, setIsHydrated] = useState(false);

    // hydration 이후 localStorage에서 저장된 locale 복원
    useEffect(() => {
        const savedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
        if (savedLocale === 'ko' || savedLocale === 'en') {
            setLocaleState(savedLocale);
        }
        setIsHydrated(true);
    }, []);

    // 언어 변경 함수
    const setLocale = useCallback((newLocale: Locale) => {
        setLocaleState(newLocale);
        localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    }, []);

    // 번역 함수
    const t = useCallback((key: string, vars?: Record<string, unknown>): string => {
        const keys = key.split('.');
        let value: unknown = translations[locale];

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = (value as Record<string, unknown>)[k];
            } else {
                return key;
            }
        }

        if (typeof value !== 'string') return key;

        // 변수 보간: {{varName}} → vars[varName]
        if (vars) {
            return value.replace(/\{\{(\w+)\}\}/g, (_, varName) =>
                varName in vars ? String(vars[varName]) : `{{${varName}}}`
            );
        }

        return value;
    }, [locale]);

    const contextValue = useMemo(() => ({
        locale,
        setLocale,
        t,
        isHydrated
    }), [locale, setLocale, t, isHydrated]);

    return (
        <LanguageContext.Provider value={contextValue}>
            {children}
        </LanguageContext.Provider>
    );
};

// useTranslation 훅
export const useTranslation = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useTranslation must be used within a LanguageProvider');
    }
    return context;
};

// useLocale 훅 (간단한 locale 접근용)
export const useLocale = () => {
    const { locale, setLocale } = useTranslation();
    return { locale, setLocale };
};
