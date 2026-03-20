'use client';

import React, { useState, useMemo } from 'react';
import type { SidebarSectionKey, SidebarItemDefinition } from '@xgen/types';
import { registry } from '@/features';

/* ── Section order ── */
const SECTION_ORDER: SidebarSectionKey[] = [
  'workspace', 'chat', 'workflow', 'data', 'train', 'model', 'mlModel',
];

const SECTION_LABELS: Record<SidebarSectionKey, string> = {
  workspace: '워크스페이스',
  chat: '채팅',
  workflow: '워크플로우',
  data: '데이터',
  train: '학습',
  model: '모델',
  mlModel: 'ML 모델',
};

/* ── Sidebar Item ── */
const SidebarItem: React.FC<{
  item: SidebarItemDefinition;
  active: boolean;
  onClick: () => void;
}> = ({ item, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
      active
        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-medium'
        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
    }`}
  >
    {item.titleKey.split('.').pop()?.replace(/([A-Z])/g, ' $1').trim() ?? item.id}
  </button>
);

/* ── XgenSidebar ── */
const XgenSidebar: React.FC<{
  activeView: string;
  onViewChange: (view: string) => void;
  collapsed?: boolean;
}> = ({ activeView, onViewChange, collapsed = false }) => {
  const sections = useMemo(() => {
    return SECTION_ORDER
      .map((key) => ({
        key,
        label: SECTION_LABELS[key],
        items: registry.getSidebarItems(key),
      }))
      .filter((s) => s.items.length > 0);
  }, []);

  if (collapsed) return null;

  return (
    <aside className="w-60 border-r bg-white dark:bg-gray-800 h-full overflow-y-auto flex flex-col">
      {/* Logo */}
      <div className="px-4 py-4 border-b">
        <h1 className="text-lg font-bold tracking-tight">XGEN</h1>
      </div>

      {/* Sections */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.key}>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 px-2 font-medium">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <SidebarItem
                  key={item.id}
                  item={item}
                  active={activeView === item.id}
                  onClick={() => onViewChange(item.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t space-y-1">
        <button
          onClick={() => onViewChange('__admin__')}
          className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
        >
          ⚙ 관리자
        </button>
        <button
          onClick={() => onViewChange('__mypage__')}
          className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
        >
          👤 마이페이지
        </button>
      </div>
    </aside>
  );
};

export default XgenSidebar;
