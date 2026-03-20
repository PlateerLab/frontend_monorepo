'use client';

import React from 'react';
import { registry } from '@/features';

export default function MlInferencePage() {
  const mod = registry.get('ml-inference');
  if (mod?.pageRoutes) {
    const Component = mod.pageRoutes['/ml-inference'];
    if (Component) return <Component />;
  }
  return <div className="flex items-center justify-center h-screen text-gray-400">ML Inference module not loaded</div>;
}
