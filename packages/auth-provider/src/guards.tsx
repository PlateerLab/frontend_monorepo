'use client';

import React from 'react';
import { useAuth } from './auth-provider';
import { isAdminMode } from '@xgen/config';

// ─────────────────────────────────────────────────────────────
// AuthGuard - 인증 필요 페이지 보호
// ─────────────────────────────────────────────────────────────

interface AuthGuardProps {
  children: React.ReactNode;
  /** 인증 안됐을 때 보여줄 컴포넌트 */
  fallback?: React.ReactNode;
  /** 로딩 중 보여줄 컴포넌트 */
  loadingFallback?: React.ReactNode;
  /** 인증 안됐을 때 리다이렉트할 URL */
  redirectTo?: string;
}

/**
 * 인증이 필요한 페이지를 보호하는 컴포넌트
 *
 * @example
 * ```tsx
 * <AuthGuard redirectTo="/auth/login">
 *   <DashboardPage />
 * </AuthGuard>
 * ```
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback,
  loadingFallback,
  redirectTo,
}) => {
  const { isAuthenticated, isLoading, login } = useAuth();

  // ADMIN_MODE가 true면 인증 우회
  if (isAdminMode()) {
    return <>{children}</>;
  }

  // 로딩 중
  if (isLoading) {
    return loadingFallback ? <>{loadingFallback}</> : (
      <div className="auth-guard-loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  // 인증 안됨
  if (!isAuthenticated) {
    if (redirectTo) {
      // 리다이렉트 옵션이 있으면 SSO로 이동
      login(redirectTo);
      return loadingFallback ? <>{loadingFallback}</> : null;
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    // 기본 fallback
    return (
      <div className="auth-guard-unauthorized">
        <p>로그인이 필요합니다.</p>
        <button onClick={() => login()}>로그인</button>
      </div>
    );
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

/**
 * 특정 섹션에 대한 접근 권한을 확인하는 컴포넌트
 *
 * @example
 * ```tsx
 * <SectionGuard section="admin" fallback={<NoAccessPage />}>
 *   <AdminDashboard />
 * </SectionGuard>
 * ```
 */
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
      <div className="section-guard-no-access">
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

/**
 * 특정 권한을 가진 사용자만 접근 가능하게 하는 컴포넌트
 *
 * @example
 * ```tsx
 * <PermissionGuard permissions={['workflow:create', 'workflow:edit']}>
 *   <CreateWorkflowButton />
 * </PermissionGuard>
 * ```
 */
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
