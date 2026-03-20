'use client';

import React from 'react';
import { registry } from '@/features';

export default function AgentPage() {
  const mod = registry.get('agent');
  if (mod?.pageRoutes) {
    const Component = mod.pageRoutes['/agent'];
    if (Component) return <Component />;
  }
  return <div className="flex items-center justify-center h-screen text-gray-400">Agent module not loaded</div>;
}
