'use client';

import React from 'react';
import { registry } from '@/features';

export default function SupportPage() {
  const mod = registry.get('support-service-request');
  if (mod?.pageRoutes) {
    const Component = mod.pageRoutes['/support'];
    if (Component) return <Component />;
  }
  return <div className="flex items-center justify-center h-screen text-gray-400">Support module not loaded</div>;
}
