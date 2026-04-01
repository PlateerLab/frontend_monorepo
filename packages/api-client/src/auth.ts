/**
 * Auth API
 * 인증 관련 API
 */

import { createApiClient } from './index';
import type { ApiResponse } from '@xgen/types';

// ============================================================================
// Types
// ============================================================================

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  access_token: string;
  refresh_token: string;
  user_id: number;
  username: string;
}

export interface SignupData {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  group_name?: string;
  mobile_phone_number?: string;
}

export interface SignupResult {
  success: boolean;
  message: string;
  username?: string;
}

export interface TokenValidationResult {
  valid: boolean;
  user_id: number | null;
  username: string | null;
  is_admin: boolean | null;
  user_type: string | null;
  available_user_section: string[] | null;
  available_admin_section: string[] | null;
  new_access_token?: string;
}

export interface UserInfo {
  user_id: number;
  username: string;
  email?: string;
  is_admin?: boolean;
  user_type?: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 브라우저에서 사용 가능한 SHA-256 해시 생성 (Web Crypto API)
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hexHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hexHash;
}

/**
 * 휴대폰 번호 정규화 (010-1234-5678 형태)
 */
function normalizePhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return phoneNumber;

  try {
    const numbersOnly = phoneNumber.replace(/[^\d]/g, '');
    const match = numbersOnly.match(/^(010|011|016|017|018|019)(\d{3,4})(\d{4})$/);

    if (match) {
      const [, prefix, middle, last] = match;
      return `${prefix}-${middle}-${last}`;
    }

    return phoneNumber;
  } catch {
    return phoneNumber;
  }
}

// ============================================================================
// Cookie Utils
// ============================================================================

export function setCookie(name: string, value: string, days: number = 7): void {
  if (typeof document === 'undefined') return;

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `xgen_${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie.match(new RegExp(`(^| )xgen_${name}=([^;]+)`));
  return match ? match[2] : null;
}

export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;

  document.cookie = `xgen_${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

export function clearAllAuthCookies(): void {
  deleteCookie('access_token');
  deleteCookie('refresh_token');
  deleteCookie('user_id');
  deleteCookie('username');
}

// ============================================================================
// Auth APIs
// ============================================================================

/**
 * 로그인
 */
export async function login(data: LoginData): Promise<LoginResult> {
  const hashedPassword = await hashPassword(data.password);

  const api = createApiClient({ service: 'auth', onUnauthorized: () => {} });
  const response = await api.post<LoginResult>('/api/auth/login', {
    email: data.email,
    password: hashedPassword,
  });

  const result = response.data;

  // 쿠키에 인증 정보 저장
  if (result.access_token) {
    setCookie('access_token', result.access_token);
  }
  if (result.refresh_token) {
    setCookie('refresh_token', result.refresh_token);
  }
  if (result.user_id) {
    setCookie('user_id', result.user_id.toString());
  }
  if (result.username) {
    setCookie('username', result.username);
  }

  return result;
}

/**
 * 회원가입
 */
export async function signup(data: SignupData): Promise<SignupResult> {
  const hashedPassword = await hashPassword(data.password);

  const normalizedData = {
    ...data,
    password: hashedPassword,
    mobile_phone_number: data.mobile_phone_number
      ? normalizePhoneNumber(data.mobile_phone_number)
      : undefined,
  };

  const api = createApiClient({ service: 'auth', onUnauthorized: () => {} });
  const response = await api.post<SignupResult>('/api/auth/signup', normalizedData);

  return response.data;
}

/**
 * 게스트 회원가입
 */
export async function signupGuest(data: SignupData): Promise<SignupResult> {
  const hashedPassword = await hashPassword(data.password);

  const normalizedData = {
    ...data,
    password: hashedPassword,
    mobile_phone_number: data.mobile_phone_number
      ? normalizePhoneNumber(data.mobile_phone_number)
      : undefined,
  };

  const api = createApiClient({ service: 'auth', onUnauthorized: () => {} });
  const response = await api.post<SignupResult>('/api/auth/signup/guest', normalizedData);

  return response.data;
}

/**
 * 로그아웃
 */
export async function logout(): Promise<void> {
  const token = getCookie('access_token');

  if (token) {
    try {
      const api = createApiClient({ service: 'auth', onUnauthorized: () => {} });
      await api.post('/api/auth/logout');
    } catch {
      // 에러 무시
    }
  }

  clearAllAuthCookies();
}

/**
 * 토큰 유효성 검증
 *
 * NOTE: onUnauthorized를 no-op으로 설정하여 401 응답 시
 * 자동 /login 리다이렉트를 방지합니다.
 * validate-token에서 401은 "토큰 무효"라는 정상 응답이므로
 * 리다이렉트가 아닌 { valid: false }를 반환해야 합니다.
 */
export async function validateToken(token?: string): Promise<TokenValidationResult> {
  const accessToken = token || getCookie('access_token');

  const invalidResult: TokenValidationResult = {
    valid: false,
    user_id: null,
    username: null,
    is_admin: null,
    user_type: null,
    available_user_section: null,
    available_admin_section: null,
  };

  if (!accessToken) {
    return invalidResult;
  }

  try {
    const api = createApiClient({
      service: 'auth',
      onUnauthorized: () => {}, // 401에서 리다이렉트 방지
    });
    const response = await api.post<TokenValidationResult>('/api/auth/validate-token', {
      token: accessToken,
    });

    // 새 토큰이 발급된 경우 쿠키 갱신
    if (response.data.new_access_token) {
      setCookie('access_token', response.data.new_access_token);
    }

    return response.data;
  } catch {
    // 401 또는 네트워크 에러 시 토큰 무효로 처리
    return invalidResult;
  }
}

/**
 * 현재 로그인된 사용자 정보 조회
 */
export async function getCurrentUser(): Promise<UserInfo | null> {
  const token = getCookie('access_token');

  if (!token) {
    return null;
  }

  try {
    const validation = await validateToken(token);

    if (!validation.valid) {
      clearAllAuthCookies();
      return null;
    }

    return {
      user_id: validation.user_id!,
      username: validation.username!,
      is_admin: validation.is_admin ?? false,
      user_type: validation.user_type ?? 'user',
    };
  } catch {
    return null;
  }
}

/**
 * 쿠키에서 사용자 정보 읽기 (API 호출 없이)
 */
export function getUserFromCookie(): UserInfo | null {
  const userId = getCookie('user_id');
  const username = getCookie('username');

  if (!userId || !username) {
    return null;
  }

  return {
    user_id: parseInt(userId, 10),
    username,
  };
}
