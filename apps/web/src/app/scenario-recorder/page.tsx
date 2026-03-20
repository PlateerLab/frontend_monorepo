'use client';

import React from 'react';
import { registry } from '@/features';

export default function ScenarioRecorderPage() {
  const mod = registry.get('scenario-recorder');
  if (mod?.pageRoutes) {
    const Component = mod.pageRoutes['/scenario-recorder'];
    if (Component) return <Component />;
  }
  return <div className="flex items-center justify-center h-screen text-gray-400">Scenario Recorder module not loaded</div>;
}
