'use client';

import React, { useMemo } from 'react';
import type { ComponentType, RouteComponentProps } from '@xgen/types';
import { registry } from '@/features';

const XgenPageContent: React.FC<{
  activeView: string;
  onNavigate: (view: string) => void;
}> = ({ activeView, onNavigate }) => {
  const routes = useMemo(() => registry.getAllRoutes(), []);

  const RouteComponent = routes[activeView] as ComponentType<RouteComponentProps> | undefined;

  if (!RouteComponent) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        <div className="text-center">
          <p className="text-4xl mb-4">📋</p>
          <p>좌측 메뉴에서 항목을 선택하세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <RouteComponent onNavigate={onNavigate} />
    </div>
  );
};

export default XgenPageContent;
