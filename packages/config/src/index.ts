// ─────────────────────────────────────────────────────────────
// Environment Configuration
// 환경변수를 중앙에서 관리하는 유틸리티
// ─────────────────────────────────────────────────────────────

export type BackendService = 'core' | 'ml' | 'data' | 'auth' | 'chat';

interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  API_BASE_URL: string;
  CORE_BASE_URL: string;
  ML_BASE_URL: string;
  DATA_BASE_URL: string;
  AUTH_BASE_URL: string;
  CHAT_BASE_URL: string;
  SSO_URL: string;
  ENABLE_MOCK: boolean;
  DEBUG_MODE: boolean;
  ADMIN_MODE: boolean; // true면 모든 인증을 우회하고 모든 페이지 접근 가능
}

// 환경변수 검증 및 기본값 설정
function getEnvVar(key: string, defaultValue?: string): string {
  if (typeof window !== 'undefined') {
    // 클라이언트
    const value = (window as unknown as Record<string, string>)[`__${key}__`]
      || process.env[`NEXT_PUBLIC_${key}`];
    return value || defaultValue || '';
  }
  // 서버
  return process.env[key] || process.env[`NEXT_PUBLIC_${key}`] || defaultValue || '';
}

function getBoolEnvVar(key: string, defaultValue: boolean = false): boolean {
  const value = getEnvVar(key);
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

// 환경 설정 객체
export const config: EnvironmentConfig = {
  NODE_ENV: (getEnvVar('NODE_ENV', 'development') as EnvironmentConfig['NODE_ENV']),
  API_BASE_URL: getEnvVar('API_BASE_URL', 'http://localhost:8000'),
  CORE_BASE_URL: getEnvVar('CORE_BASE_URL', 'http://localhost:8000'),
  ML_BASE_URL: getEnvVar('ML_BASE_URL', 'http://localhost:8001'),
  DATA_BASE_URL: getEnvVar('DATA_BASE_URL', 'http://localhost:8002'),
  AUTH_BASE_URL: getEnvVar('AUTH_BASE_URL', 'http://localhost:8000'),
  CHAT_BASE_URL: getEnvVar('CHAT_BASE_URL', 'http://localhost:8000'),
  SSO_URL: getEnvVar('SSO_URL', 'http://localhost:8080'),
  ENABLE_MOCK: getBoolEnvVar('ENABLE_MOCK', false),
  DEBUG_MODE: getBoolEnvVar('DEBUG_MODE', false),
  ADMIN_MODE: getBoolEnvVar('ADMIN_MODE', false),
};

/**
 * 백엔드 서비스별 URL 반환
 *
 * 클라이언트 사이드: 빈 문자열 반환 (Next.js rewrites 프록시 사용)
 * 서버 사이드: 실제 백엔드 URL 반환
 *
 * @example
 * ```ts
 * const coreUrl = getBackendUrl('core');
 * const mlUrl = getBackendUrl('ml');
 * ```
 */
export function getBackendUrl(service: BackendService): string {
  // 클라이언트 사이드: Next.js rewrites를 통한 프록시 사용 (Mixed Content / CORS 방지)
  if (typeof window !== 'undefined') {
    return '';
  }

  // 서버 사이드: 실제 백엔드 URL 사용
  const urlMap: Record<BackendService, string> = {
    core: config.CORE_BASE_URL,
    ml: config.ML_BASE_URL,
    data: config.DATA_BASE_URL,
    auth: config.AUTH_BASE_URL,
    chat: config.CHAT_BASE_URL,
  };

  return urlMap[service] || config.API_BASE_URL;
}

/**
 * SSO URL 반환
 */
export function getSsoUrl(): string {
  return config.SSO_URL;
}

/**
 * 개발 환경 여부
 */
export function isDevelopment(): boolean {
  return config.NODE_ENV === 'development';
}

/**
 * 프로덕션 환경 여부
 */
export function isProduction(): boolean {
  return config.NODE_ENV === 'production';
}

/**
 * Mock 모드 활성화 여부
 */
export function isMockEnabled(): boolean {
  return config.ENABLE_MOCK;
}

/**
 * 디버그 모드 여부
 */
export function isDebugMode(): boolean {
  return config.DEBUG_MODE;
}

/**
 * Admin 모드 여부 (테스트용 - 모든 인증 우회)
 */
export function isAdminMode(): boolean {
  return config.ADMIN_MODE;
}
