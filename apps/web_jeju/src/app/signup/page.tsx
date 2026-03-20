'use client';

import React from 'react';
import { registry } from '@/features';

export default function SignupPage() {
  const mod = registry.get('auth-signup');
  if (mod?.pageRoutes) {
    const Component = mod.pageRoutes['/signup'];
    if (Component) return <Component />;
  }
  return <div className="flex items-center justify-center h-screen text-gray-400">Signup module not loaded</div>;
}
