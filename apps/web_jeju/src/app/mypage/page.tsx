'use client';

import React from 'react';
import { registry } from '@/features';

export default function MypagePage() {
  const mod = registry.get('mypage');
  if (mod?.pageRoutes) {
    const Component = mod.pageRoutes['/mypage'];
    if (Component) return <Component />;
  }
  return <div className="flex items-center justify-center h-screen text-gray-400">MyPage module not loaded</div>;
}
