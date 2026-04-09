'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import type { User, AuthState } from '@xgen/types';
import { hasPermission as checkPermission, canAccessAdmin } from '@xgen/types';
import {
  login as apiLogin,
  logout as apiLogout,
  validateToken,
  getCookie,
  clearAllAuthCookies,
  decodeJwtPayload,
  type TokenValidationResult,
} from '@xgen/api-client';

// ─────────────────────────────────────────────────────────────
// Auth Context Types
// ─────────────────────────────────────────────────────────────

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResultState {
  success: boolean;
  error?: string;
}

interface AuthContextValue extends AuthState {
  /** 이메일/비밀번호 직접 로그인 */
  loginWithCredentials: (credentials: LoginCredentials) => Promise<LoginResultState>;
  /** 로그인 페이지로 리다이렉트 */
  redirectToLogin: (redirectUrl?: string) => void;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAccessToSection: (section: string) => boolean;
  /** 로그아웃 진행 중 여부 (guard redirect loop 방지) */
  isLoggingOut: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─────────────────────────────────────────────────────────────
// Auth Provider Component
// ─────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: React.ReactNode;
  onAuthStateChange?: (state: AuthState) => void;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, onAuthStateChange }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const lastCheckedTokenRef = useRef<string | null>(null);

  // ──────────────────────────────────────────────────────────
  // 인증 정보 클리어
  // ──────────────────────────────────────────────────────────
  const clearAuth = useCallback(() => {
    setIsLoggingOut(true);
    clearAllAuthCookies();

    setUser(null);
    lastCheckedTokenRef.current = null;

    // 100ms 후 isLoggingOut 해제 (AuthGuard redirect loop 방지)
    setTimeout(() => {
      setIsLoggingOut(false);
    }, 100);
  }, []);

  // ──────────────────────────────────────────────────────────
  // 토큰 검증 및 섹션 정보 로드
  // user_id + roles 기반으로 서버에서 ABAC 권한(permissions) 조회
  // ──────────────────────────────────────────────────────────
  const loadUserSections = useCallback(async (token: string): Promise<TokenValidationResult | null> => {
    try {
      const result = await validateToken(token);

      if (result.valid) {
        // 사용자 정보 업데이트 (ABAC 필드)
        setUser(prev => prev ? {
          ...prev,
          is_superuser: result.is_superuser ?? result.is_admin ?? false,
          is_admin: result.is_superuser ?? result.is_admin ?? false,
          roles: result.roles ?? [],
          permissions: result.permissions ?? [],
          user_type: result.user_type,
        } : prev);

        lastCheckedTokenRef.current = token;
        return result;
      } else {
        // 토큰 무효 → 인증 정보 클리어
        clearAuth();
        return null;
      }
    } catch {
      return null;
    }
  }, [clearAuth]);

  // ──────────────────────────────────────────────────────────
  // 쿠키에서 인증 상태 복원 (JWT 디코드 + permissions 로드)
  // ──────────────────────────────────────────────────────────
  const refreshAuth = useCallback(async () => {
    const accessToken = getCookie('access_token');

    if (accessToken) {
      // JWT payload에서 사용자 정보 추출 (쿠키 노출 없이)
      const payload = decodeJwtPayload(accessToken);

      if (payload) {
        setUser({
          id: payload.sub,
          user_id: parseInt(payload.sub, 10),
          username: payload.username,
          is_superuser: payload.is_superuser ?? payload.is_admin ?? false,
          is_admin: payload.is_superuser ?? payload.is_admin ?? false,
          roles: payload.roles ?? [],
        });

        // JWT에는 permissions가 없으므로 validate-token API로 가져옴
        // user_id + roles 기반으로 서버에서 ABAC 권한 조회
        await loadUserSections(accessToken);
      } else {
        // JWT 디코드 실패 → 인증 정보 클리어
        setUser(null);
      }
    } else {
      setUser(null);
    }

    setIsInitialized(true);
  }, [loadUserSections]);

  // ──────────────────────────────────────────────────────────
  // 초기 로드
  // ──────────────────────────────────────────────────────────
  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  // 상태 변경 콜백
  useEffect(() => {
    onAuthStateChange?.({
      user,
      isAuthenticated: !!user,
      isLoading,
      isInitialized,
    });
  }, [user, isLoading, isInitialized, onAuthStateChange]);

  // ──────────────────────────────────────────────────────────
  // 로그인: 이메일/비밀번호 직접 로그인
  // ──────────────────────────────────────────────────────────
  const loginWithCredentials = useCallback(async (credentials: LoginCredentials): Promise<LoginResultState> => {
    setIsLoading(true);
    try {
      const result = await apiLogin({
        email: credentials.email,
        password: credentials.password,
      });

      // access_token 존재 여부로 로그인 성공 판단 (백엔드가 success 필드를 반환하지 않을 수 있음)
      if (result.access_token) {
        // JWT payload에서 사용자 정보 추출
        const payload = decodeJwtPayload(result.access_token);
        const newUser: User = {
          id: payload?.sub ?? result.user_id?.toString() ?? '',
          user_id: payload ? parseInt(payload.sub, 10) : (result.user_id ?? 0),
          username: payload?.username ?? result.username ?? '',
          email: credentials.email,
          is_superuser: payload?.is_superuser ?? payload?.is_admin ?? false,
          is_admin: payload?.is_superuser ?? payload?.is_admin ?? false,
          roles: payload?.roles ?? [],
        };
        setUser(newUser);

        // 섹션 정보 로드
        await loadUserSections(result.access_token);

        return { success: true };
      }

      return { success: false, error: 'LOGIN_FAILED' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'LOGIN_FAILED';
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [loadUserSections]);

  // ──────────────────────────────────────────────────────────
  // 로그인 페이지로 리다이렉트
  // ──────────────────────────────────────────────────────────
  const redirectToLogin = useCallback((redirectUrl?: string) => {
    if (typeof window === 'undefined') return;

    const currentUrl = redirectUrl || window.location.href;
    const encodedRedirect = encodeURIComponent(currentUrl);
    window.location.href = `/login?redirect=${encodedRedirect}`;
  }, []);

  // ──────────────────────────────────────────────────────────
  // 로그아웃
  // ──────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // 에러 무시
    } finally {
      clearAuth();

      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  }, [clearAuth]);

  // ──────────────────────────────────────────────────────────
  // 권한 확인
  // ──────────────────────────────────────────────────────────
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    // ABAC: 와일드카드 매칭 사용
    return checkPermission(user.permissions ?? [], permission);
  }, [user]);

  // 섹션 접근 권한 확인 (ABAC 기반)
  const hasAccessToSection = useCallback((section: string): boolean => {
    if (!user) return false;

    // superuser는 모든 섹션 접근 가능
    if (user.is_superuser) return true;

    // ABAC: 퍼미션 기반 체크 (section → resource 매핑)
    if (user.permissions && user.permissions.length > 0) {
      return checkPermission(user.permissions, `${section}:read`) ||
             checkPermission(user.permissions, `${section}:*`);
    }

    // 권한이 없으면 기본 거부
    return false;
  }, [user]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    isInitialized,
    loginWithCredentials,
    redirectToLogin,
    logout,
    refreshAuth,
    hasPermission,
    hasAccessToSection,
    isLoggingOut,
  }), [user, isLoading, isInitialized, loginWithCredentials, redirectToLogin, logout, refreshAuth,
    hasPermission, hasAccessToSection, isLoggingOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────────
// useAuth Hook
// ─────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
