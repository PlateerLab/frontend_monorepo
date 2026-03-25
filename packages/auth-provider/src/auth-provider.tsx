'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { User, AuthState } from '@xgen/types';
import { createApiClient } from '@xgen/api-client';
import { getSsoUrl } from '@xgen/config';

// ─────────────────────────────────────────────────────────────
// Auth Context Types
// ─────────────────────────────────────────────────────────────

interface AuthContextValue extends AuthState {
  login: (redirectUrl?: string) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAccessToSection: (section: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─────────────────────────────────────────────────────────────
// Cookie Utils
// ─────────────────────────────────────────────────────────────

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// ─────────────────────────────────────────────────────────────
// Auth Provider Component
// ─────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: React.ReactNode;
  onAuthStateChange?: (state: AuthState) => void;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, onAuthStateChange }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 사용자 정보 조회
  const fetchUser = useCallback(async (): Promise<User | null> => {
    const token = getCookie('xgen_access_token');
    if (!token) return null;

    try {
      const api = createApiClient();
      const response = await api.get<User>('/auth/me');
      return response.data;
    } catch {
      return null;
    }
  }, []);

  // 사용자 정보 새로고침
  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const userData = await fetchUser();
      setUser(userData);
    } finally {
      setIsLoading(false);
    }
  }, [fetchUser]);

  // 초기 로드
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // 상태 변경 콜백
  useEffect(() => {
    onAuthStateChange?.({
      user,
      isAuthenticated: !!user,
      isLoading,
    });
  }, [user, isLoading, onAuthStateChange]);

  // 로그인 (SSO로 리다이렉트)
  const login = useCallback((redirectUrl?: string) => {
    const ssoUrl = getSsoUrl();
    const currentUrl = redirectUrl || (typeof window !== 'undefined' ? window.location.href : '/');
    const encodedRedirect = encodeURIComponent(currentUrl);
    window.location.href = `${ssoUrl}/login?redirect=${encodedRedirect}`;
  }, []);

  // 로그아웃
  const logout = useCallback(async () => {
    try {
      const api = createApiClient();
      await api.post('/auth/logout');
    } catch {
      // 에러 무시
    } finally {
      deleteCookie('xgen_access_token');
      deleteCookie('xgen_refresh_token');
      setUser(null);

      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  }, []);

  // 권한 확인
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    return user.permissions?.includes(permission) ?? false;
  }, [user]);

  // 섹션 접근 권한 확인
  const hasAccessToSection = useCallback((section: string): boolean => {
    if (!user) return false;

    // 관리자는 모든 섹션 접근 가능
    if (user.role === 'admin') return true;

    // 섹션별 권한 매핑
    const sectionPermissionMap: Record<string, string> = {
      chat: 'chat:access',
      workflow: 'workflow:access',
      model: 'model:access',
      'ml-model': 'ml:access',
      data: 'data:access',
      admin: 'admin:access',
    };

    const requiredPermission = sectionPermissionMap[section];
    if (!requiredPermission) return true; // 매핑이 없으면 허용

    return hasPermission(requiredPermission);
  }, [user, hasPermission]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
    hasPermission,
    hasAccessToSection,
  }), [user, isLoading, login, logout, refreshUser, hasPermission, hasAccessToSection]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────────
// useAuth Hook
// ─────────────────────────────────────────────────────────────

/**
 * 인증 상태 및 메서드에 접근하는 훅
 *
 * @example
 * ```tsx
 * const { user, isAuthenticated, login, logout, hasAccessToSection } = useAuth();
 *
 * if (!isAuthenticated) {
 *   return <button onClick={() => login()}>로그인</button>;
 * }
 *
 * if (!hasAccessToSection('admin')) {
 *   return <div>접근 권한이 없습니다.</div>;
 * }
 * ```
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
