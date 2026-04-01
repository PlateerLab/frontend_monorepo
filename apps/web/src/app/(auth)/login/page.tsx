'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ReverseAuthGuard } from '@xgen/auth-provider';
import { LoginForm } from '@xgen/feature-auth-LoginForm';

/**
 * 로그인 페이지 — Assembly Only
 *
 * 설계 원칙:
 * - 비즈니스 로직 없음 (LoginForm feature에 위임)
 * - ReverseAuthGuard로 이미 로그인된 사용자 리다이렉트
 * - URL의 redirect 파라미터를 LoginForm에 전달
 */

function LoginPageContent() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect')
    ? decodeURIComponent(searchParams.get('redirect')!)
    : undefined;

  return (
    <ReverseAuthGuard>
      <LoginForm
        redirectUrl={redirectUrl}
        forgotPasswordHref="/forgot-password"
        signupHref="/signup"
      />
    </ReverseAuthGuard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
