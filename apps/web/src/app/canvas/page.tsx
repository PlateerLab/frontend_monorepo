'use client';

import React from 'react';
import { registry } from '@/features';

export default function CanvasPage() {
  // canvas-intro 모듈에서 등록한 CanvasPage 사용
  const canvasIntro = registry.get('canvas-intro');
  if (canvasIntro?.pageRoutes) {
    const PageComponent = canvasIntro.pageRoutes['/canvas'];
    if (PageComponent) return <PageComponent />;
  }
  return <div className="flex items-center justify-center h-screen text-gray-400">Canvas module not loaded</div>;
}
