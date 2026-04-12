'use client';

import React, { Suspense } from 'react';
import { TeamsApp } from '@xgen/feature-teams';

const LoadingSpinner: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
    <div
      style={{
        width: 40,
        height: 40,
        border: '3px solid #e5e7eb',
        borderTopColor: '#305eeb',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default function TeamsRoute() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TeamsApp />
    </Suspense>
  );
}
