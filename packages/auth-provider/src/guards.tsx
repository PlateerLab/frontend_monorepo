'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from './auth-provider';
import { isAdminMode } from '@xgen/config';
import { validateToken, getCookie } from '@xgen/api-client';

// ─────────────────────────────────────────────────────────────
// AuthGuard - 인증 필요 페이지 보호
// xgen-frontend의 AuthGuard.tsx를 기반으로 구현
// ─────────────────────────────────────────────────────────────

interface AuthGuardProps {
  children: React.ReactNode;
  /** 인증 안됐을 때 리다이렉트할 URL (기본: /login) */
  redirectTo?: string;
  /** 필요한 섹션 ID */
  requiredSection?: string;
  /** 섹션 권한 없을 때 리다이렉트할 URL (기본: /main) */
  sectionRedirectTo?: string;
  /** 로딩 중 보여줄 컴포넌트 */
  loadingFallback?: React.ReactNode;
}

/**
 * 인증이 필요한 페이지를 보호하는 컴포넌트.
 *
 * 1. CookieProvider(AuthProvider) 초기화 대기
 * 2. 쿠키에 user 정보가 없으면 → 로그인 페이지로 리다이렉트
 * 3. validateToken()으로 토큰 유효성 검증
 * 4. 무효 → clearAuth + 로그인으로 리다이렉트
 * 5. 유효 → 섹션 권한 확인 → children 렌더
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  redirectTo = '/login',
  requiredSection,
  sectionRedirectTo = '/main',
  loadingFallback,
}) => {
  const {
    user,
    isInitialized,
    isLoggingOut,
    redirectToLogin,
    hasAccessToSection,
  } = useAuth();

  const [isValidated, setIsValidated] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const lastCheckedTokenRef = useRef<string | null>(null);
  const adminMode = isAdminMode();

  // 초기화 대기
  useEffect(() => {
    if (adminMode) return;
    if (!isInitialized || isLoggingOut) return;

    const token = getCookie('access_token');

    // 유저 없음 → 로그인으로
    if (!user || !token) {
      if (typeof window !== 'undefined') {
        const currentUrl = window.location.href;
        const encodedRedirect = encodeURIComponent(currentUrl);
        window.location.href = `${redirectTo}?redirect=${encodedRedirect}`;
      }
      return;
    }

    // 이미 같은 토큰으로 검증했으면 스킵
    if (lastCheckedTokenRef.current === token) {
      setIsValidated(true);
      return;
    }

    // 토큰 검증
    setIsValidating(true);
    validateToken(token)
      .then((result) => {
        if (result.valid) {
          lastCheckedTokenRef.current = token;
          setIsValidated(true);
        } else {
          // 토큰 무효 → 로그인으로
          redirectToLogin();
        }
      })
      .catch(() => {
        // 검증 실패해도 쿠키 기반으로 통과시킴 (네트워크 에러 등)
        setIsValidated(true);
      })
      .finally(() => {
        setIsValidating(false);
      });
  }, [adminMode, isInitialized, isLoggingOut, user, redirectTo, redirectToLogin]);

  // 섹션 권한 확인
  useEffect(() => {
    if (adminMode) return;
    if (!isValidated || !requiredSection) return;

    if (!hasAccessToSection(requiredSection)) {
      if (typeof window !== 'undefined') {
        window.location.href = sectionRedirectTo;
      }
    }
  }, [adminMode, isValidated, requiredSection, hasAccessToSection, sectionRedirectTo]);

  // ADMIN_MODE가 true면 인증 우회
  if (adminMode) {
    return <>{children}</>;
  }

  // 아직 초기화 안됨 또는 검증 중
  if (!isInitialized || isValidating || !isValidated) {
    return loadingFallback ? <>{loadingFallback}</> : (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div>로딩중...</div>
      </div>
    );
  }

  // 유저가 없으면 렌더하지 않음 (리다이렉트 중)
  if (!user) {
    return null;
  }

  return <>{children}</>;
};

// ─────────────────────────────────────────────────────────────
// ReverseAuthGuard - 이미 로그인된 사용자는 접근 차단
// 로그인/회원가입 페이지에서 사용
// ─────────────────────────────────────────────────────────────

interface ReverseAuthGuardProps {
  children: React.ReactNode;
  /** 로그인 상태일 때 리다이렉트할 URL (기본: /main?section=main-dashboard) */
  redirectTo?: string;
  /** 로딩 중 보여줄 컴포넌트 */
  loadingFallback?: React.ReactNode;
}

/**
 * 이미 로그인된 사용자가 로그인/회원가입 페이지에 접근하면
 * 이전 페이지 또는 대시보드로 리다이렉트하는 컴포넌트
 */
export const ReverseAuthGuard: React.FC<ReverseAuthGuardProps> = ({
  children,
  redirectTo = '/main?section=main-dashboard',
  loadingFallback,
}) => {
  const { user, isInitialized, isLoggingOut } = useAuth();
  const [shouldRender, setShouldRender] = useState(false);
  const adminMode = isAdminMode();

  useEffect(() => {
    if (adminMode) {
      setShouldRender(true);
      return;
    }
    if (!isInitialized) return;

    // 로그아웃 중이면 로그인 페이지 보여줌
    if (isLoggingOut) {
      setShouldRender(true);
      return;
    }

    // 유저 없음 → 로그인 페이지 보여줌
    if (!user) {
      setShouldRender(true);
      return;
    }

    // 유저 있음 → 토큰 검증 후 리다이렉트
    const token = getCookie('access_token');
    if (!token) {
      setShouldRender(true);
      return;
    }

    validateToken(token)
      .then((result) => {
        if (result.valid) {
          // 이미 로그인됨 → 리다이렉트
          if (typeof window !== 'undefined') {
            // URL에 redirect 파라미터가 있으면 그쪽으로
            const params = new URLSearchParams(window.location.search);
            const redirectParam = params.get('redirect');
            if (redirectParam) {
              window.location.href = decodeURIComponent(redirectParam);
            } else {
              window.location.href = redirectTo;
            }
          }
        } else {
          // 토큰 무효 → 로그인 페이지 보여줌
          setShouldRender(true);
        }
      })
      .catch(() => {
        setShouldRender(true);
      });
  }, [adminMode, isInitialized, isLoggingOut, user, redirectTo]);

  if (!isInitialized || !shouldRender) {
    return loadingFallback ? <>{loadingFallback}</> : null;
  }

  return <>{children}</>;
};

// ─────────────────────────────────────────────────────────────
// SectionGuard - 섹션 접근 권한 보호
// ─────────────────────────────────────────────────────────────

interface SectionGuardProps {
  children: React.ReactNode;
  /** 필요한 섹션 ID */
  section: string;
  /** 권한 없을 때 보여줄 컴포넌트 */
  fallback?: React.ReactNode;
}

export const SectionGuard: React.FC<SectionGuardProps> = ({
  children,
  section,
  fallback,
}) => {
  const { hasAccessToSection, isLoading } = useAuth();

  // ADMIN_MODE가 true면 권한 우회
  if (isAdminMode()) {
    return <>{children}</>;
  }

  if (isLoading) {
    return null;
  }

  if (!hasAccessToSection(section)) {
    return fallback ? <>{fallback}</> : (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p>이 섹션에 접근할 권한이 없습니다.</p>
      </div>
    );
  }

  return <>{children}</>;
};

// ─────────────────────────────────────────────────────────────
// PermissionGuard - 특정 권한 보호
// ─────────────────────────────────────────────────────────────

interface PermissionGuardProps {
  children: React.ReactNode;
  /** 필요한 권한 목록 (OR 조건) */
  permissions: string[];
  /** 모든 권한이 필요한지 여부 (AND 조건) */
  requireAll?: boolean;
  /** 권한 없을 때 보여줄 컴포넌트 */
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permissions,
  requireAll = false,
  fallback,
}) => {
  const { hasPermission, isLoading } = useAuth();

  // ADMIN_MODE가 true면 권한 우회
  if (isAdminMode()) {
    return <>{children}</>;
  }

  if (isLoading) {
    return null;
  }

  const hasAccess = requireAll
    ? permissions.every(hasPermission)
    : permissions.some(hasPermission);

  if (!hasAccess) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};
