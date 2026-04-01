'use client';

import type { Locale } from './types';

// ─────────────────────────────────────────────────────────────
// Translation Registry
// 각 feature에서 자신의 번역을 동적으로 등록할 수 있는 중앙 레지스트리
// ─────────────────────────────────────────────────────────────

type NestedTranslation = string | string[] | { [key: string]: NestedTranslation };
type TranslationData = Record<string, NestedTranslation>;

/**
 * 깊은 병합 유틸리티
 * 같은 네임스페이스에 여러 feature가 번역을 등록할 수 있도록 지원
 */
function deepMerge(target: TranslationData, source: TranslationData): TranslationData {
  for (const key in source) {
    if (
      key in target &&
      typeof target[key] === 'object' && !Array.isArray(target[key]) &&
      typeof source[key] === 'object' && !Array.isArray(source[key])
    ) {
      target[key] = deepMerge(
        target[key] as TranslationData,
        source[key] as TranslationData
      );
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// 전역 번역 저장소
const translationStore: Record<Locale, TranslationData> = {
  ko: {},
  en: {},
};

// 등록된 네임스페이스 추적
const registeredNamespaces = new Set<string>();

// 리스너 (번역 변경 시 알림)
type TranslationListener = () => void;
const listeners = new Set<TranslationListener>();

/**
 * 번역 등록
 * @param namespace - 번역 네임스페이스 (예: 'authProfile', 'workflows')
 * @param locale - 언어 코드
 * @param translations - 번역 데이터
 */
export function registerTranslations(
  namespace: string,
  locale: Locale,
  translations: TranslationData
): void {
  // 해당 네임스페이스로 번역 등록 (기존 데이터와 깊은 병합)
  if (translationStore[locale][namespace]) {
    translationStore[locale][namespace] = deepMerge(
      translationStore[locale][namespace] as TranslationData,
      translations
    );
  } else {
    translationStore[locale][namespace] = translations;
  }
  registeredNamespaces.add(namespace);

  // 리스너에게 알림
  listeners.forEach((listener) => listener());
}

/**
 * 여러 번역을 한 번에 등록 (namespace별로 ko/en 모두)
 */
export function registerTranslationBundle(
  namespace: string,
  bundle: { ko: TranslationData; en: TranslationData }
): void {
  registerTranslations(namespace, 'ko', bundle.ko);
  registerTranslations(namespace, 'en', bundle.en);
}

/**
 * 번역 값 조회
 */
export function getTranslation(
  locale: Locale,
  key: string,
  vars?: Record<string, unknown>
): string {
  const keys = key.split('.');
  let value: unknown = translationStore[locale];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      // 번역이 없으면 키 반환
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
}

/**
 * 특정 locale의 모든 번역 가져오기
 */
export function getAllTranslations(locale: Locale): TranslationData {
  return translationStore[locale];
}

/**
 * 네임스페이스가 등록되었는지 확인
 */
export function isNamespaceRegistered(namespace: string): boolean {
  return registeredNamespaces.has(namespace);
}

/**
 * 등록된 네임스페이스 목록
 */
export function getRegisteredNamespaces(): string[] {
  return Array.from(registeredNamespaces);
}

/**
 * 번역 변경 리스너 추가
 */
export function addTranslationListener(listener: TranslationListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * 번역 초기화 (테스트용)
 */
export function clearTranslations(): void {
  translationStore.ko = {};
  translationStore.en = {};
  registeredNamespaces.clear();
}
