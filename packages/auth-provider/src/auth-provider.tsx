'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import type { User, AuthState } from '@xgen/types';
import {
  login as apiLogin,
  logout as apiLogout,
  validateToken,
  getCookie,
  setCookie,
  clearAllAuthCookies,
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
  /** 사용 가능한 사용자 섹션 */
  availableUserSections: string[];
  /** 사용 가능한 관리자 섹션 */
  availableAdminSections: string[];
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
  const [availableUserSections, setAvailableUserSections] = useState<string[]>([]);
  const [availableAdminSections, setAvailableAdminSections] = useState<string[]>([]);
  const lastCheckedTokenRef = useRef<string | null>(null);

  // ──────────────────────────────────────────────────────────
  // 쿠키에서 인증 상태 복원
  // ──────────────────────────────────────────────────────────
  const refreshAuth = useCallback(async () => {
    const accessToken = getCookie('access_token');
    const userId = getCookie('user_id');
    const username = getCookie('username');

    if (accessToken && userId && username) {
      // 쿠키에서 기본 정보 복원
      setUser({
        id: userId,
        user_id: parseInt(userId, 10),
        username,
      });

      // 섹션 정보 복원 (쿠키에서)
      const savedUserSections = getCookie('available_user_section');
      const savedAdminSections = getCookie('available_admin_section');
      if (savedUserSections) {
        setAvailableUserSections(savedUserSections.split(',').filter(Boolean));
      }
      if (savedAdminSections) {
        setAvailableAdminSections(savedAdminSections.split(',').filter(Boolean));
      }
    } else {
      setUser(null);
      setAvailableUserSections([]);
      setAvailableAdminSections([]);
    }

    setIsInitialized(true);
  }, []);

  // ──────────────────────────────────────────────────────────
  // 토큰 검증 및 섹션 정보 로드
  // ──────────────────────────────────────────────────────────
  const loadUserSections = useCallback(async (token: string): Promise<TokenValidationResult | null> => {
    try {
      const result = await validateToken(token);

      if (result.valid) {
        // 사용자 정보 업데이트
        setUser(prev => prev ? {
          ...prev,
          is_admin: result.is_admin ?? false,
          user_type: result.user_type ?? 'user',
          available_user_section: result.available_user_section ?? [],
          available_admin_section: result.available_admin_section ?? [],
        } : prev);

        // 섹션 정보 업데이트
        const userSections = result.available_user_section ?? [];
        const adminSections = result.available_admin_section ?? [];
        setAvailableUserSections(userSections);
        setAvailableAdminSections(adminSections);

        // 섹션 정보 쿠키에 저장
        if (userSections.length > 0) {
          setCookie('available_user_section', userSections.join(','), 30);
        }
        if (adminSections.length > 0) {
          setCookie('available_admin_section', adminSections.join(','), 30);
        }

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
  }, []);

  // ──────────────────────────────────────────────────────────
  // 인증 정보 클리어
  // ──────────────────────────────────────────────────────────
  const clearAuth = useCallback(() => {
    setIsLoggingOut(true);
    clearAllAuthCookies();

    // 섹션 쿠키도 삭제
    if (typeof document !== 'undefined') {
      document.cookie = 'xgen_available_user_section=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'xgen_available_admin_section=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }

    setUser(null);
    setAvailableUserSections([]);
    setAvailableAdminSections([]);
    lastCheckedTokenRef.current = null;

    // 100ms 후 isLoggingOut 해제 (AuthGuard redirect loop 방지)
    setTimeout(() => {
      setIsLoggingOut(false);
    }, 100);
  }, []);

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

      if (result.success && result.access_token) {
        // 사용자 정보 설정
        const newUser: User = {
          id: result.user_id.toString(),
          user_id: result.user_id,
          username: result.username,
          email: credentials.email,
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
    return user.permissions?.includes(permission) ?? false;
  }, [user]);

  // 섹션 접근 권한 확인
  const hasAccessToSection = useCallback((section: string): boolean => {
    if (!user) return false;

    // 관리자는 모든 섹션 접근 가능
    if (user.is_admin) return true;

    // available_user_section에 해당 섹션이 있는지 확인
    if (availableUserSections.length > 0) {
      return availableUserSections.includes(section);
    }

    // 섹션 정보가 없으면 기본 허용
    return true;
  }, [user, availableUserSections]);

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
    availableUserSections,
    availableAdminSections,
    isLoggingOut,
  }), [user, isLoading, isInitialized, loginWithCredentials, redirectToLogin, logout, refreshAuth,
    hasPermission, hasAccessToSection, availableUserSections, availableAdminSections, isLoggingOut]);

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
