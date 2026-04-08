'use client';

import React, { Suspense } from 'react';
import { ReverseAuthGuard } from '@xgen/auth-provider';
import { SignupForm } from '@xgen/feature-auth-signup-form';

/**
 * 회원가입 페이지 — Assembly Only
 *
 * 설계 원칙:
 * - 비즈니스 로직 없음 (SignupForm feature에 위임)
 * - ReverseAuthGuard로 이미 로그인된 사용자 리다이렉트
 */

function SignupPageContent() {
  return (
    <ReverseAuthGuard>
      <SignupForm loginHref="/login" />
    </ReverseAuthGuard>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageContent />
    </Suspense>
  );
}
