'use client';

import React from 'react';
import { registry } from '@/features';

export default function ForgotPasswordPage() {
  const mod = registry.get('auth-forgot-password');
  if (mod?.pageRoutes) {
    const Component = mod.pageRoutes['/forgot-password'];
    if (Component) return <Component />;
  }
  return <div className="flex items-center justify-center h-screen text-gray-400">Forgot password module not loaded</div>;
}
