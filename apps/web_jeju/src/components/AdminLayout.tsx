'use client';

import React, { useMemo, useState } from 'react';
import type { AdminSubModule } from '@xgen/types';
import { registry } from '@/features';

/* ── Admin Sidebar ── */
const AdminSidebar: React.FC<{
  modules: AdminSubModule[];
  activeRoute: string;
  onRouteChange: (route: string) => void;
}> = ({ modules, activeRoute, onRouteChange }) => (
  <aside className="w-60 border-r bg-white dark:bg-gray-800 h-full overflow-y-auto flex flex-col">
    <div className="px-4 py-4 border-b">
      <h2 className="text-lg font-bold tracking-tight">⚙ 관리자</h2>
    </div>
    <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
      {modules.map((mod) => (
        <div key={mod.id}>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 px-2 font-medium">
            {mod.name}
          </p>
          <div className="space-y-0.5">
            {mod.sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onRouteChange(item.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeRoute === item.id
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-medium'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {item.titleKey.split('.').pop()?.replace(/([A-Z])/g, ' $1').trim() ?? item.id}
              </button>
            ))}
          </div>
        </div>
      ))}
    </nav>
    <div className="p-3 border-t">
      <a href="/main" className="block text-center text-sm text-blue-500 hover:underline">← 메인으로</a>
    </div>
  </aside>
);

/* ── Admin Page Content ── */
const AdminPageContent: React.FC<{ modules: AdminSubModule[]; activeRoute: string }> = ({ modules, activeRoute }) => {
  for (const mod of modules) {
    const Component = mod.routes[activeRoute];
    if (Component) return <Component />;
  }
  return (
    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
      <div className="text-center">
        <p className="text-4xl mb-4">⚙</p>
        <p>관리 메뉴를 선택하세요</p>
      </div>
    </div>
  );
};

/* ── Admin Layout ── */
const AdminLayout: React.FC = () => {
  const modules = useMemo(() => registry.getAdminSubs(), []);
  const firstRoute = modules[0]?.sidebarItems[0]?.id ?? '';
  const [activeRoute, setActiveRoute] = useState(firstRoute);

  return (
    <div className="flex h-screen">
      <AdminSidebar modules={modules} activeRoute={activeRoute} onRouteChange={setActiveRoute} />
      <main className="flex-1 overflow-y-auto">
        <AdminPageContent modules={modules} activeRoute={activeRoute} />
      </main>
    </div>
  );
};

export default AdminLayout;
