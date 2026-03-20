'use client';

import React from 'react';
import { registry } from '@/features';

export default function LoginPage() {
  const mod = registry.get('auth-login');
  if (mod?.pageRoutes) {
    const Component = mod.pageRoutes['/login'];
    if (Component) return <Component />;
  }
  return <div className="flex items-center justify-center h-screen text-gray-400">Login module not loaded</div>;
}
