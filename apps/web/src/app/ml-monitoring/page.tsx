'use client';

import React from 'react';
import { registry } from '@/features';

export default function MlMonitoringPage() {
  const mod = registry.get('ml-train-monitor');
  if (mod?.pageRoutes) {
    const Component = mod.pageRoutes['/ml-monitoring'];
    if (Component) return <Component />;
  }
  return <div className="flex items-center justify-center h-screen text-gray-400">ML Monitoring module not loaded</div>;
}
