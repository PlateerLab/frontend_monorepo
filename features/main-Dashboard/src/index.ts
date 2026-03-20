'use client';
import React from 'react';
import type { FeatureModule } from '@xgen/types';

/* ?€?€ KPI Card ?€?€ */
const KpiCard: React.FC<{ icon: string; label: string; count: number; color: string; updatedAt?: string }> = ({ icon, label, count, color, updatedAt }) => (
  <div className="p-4 rounded-xl border bg-white dark:bg-gray-800 flex flex-col gap-2">
    <div className="flex items-center gap-2">
      <span className="text-xl" style={{ color }}>{icon}</span>
      <span className="text-sm text-gray-500">{label}</span>
    </div>
    <p className="text-3xl font-bold" style={{ color }}>{count}</p>
    {updatedAt && <p className="text-xs text-gray-400">ìµœì¢… ?…ë°?´íŠ¸: {updatedAt}</p>}
  </div>
);

/* ?€?€ Main Dashboard ?€?€ */
const MainDashboard: React.FC = () => (
  <div className="p-6 space-y-8">
    <div>
      <h1 className="text-2xl font-bold mb-1">?ˆë…•?˜ì„¸???‘‹</h1>
      <p className="text-sm text-gray-500">?¤ëŠ˜???Œí¬?Œë ˆ?´ìŠ¤ ?„í™©?…ë‹ˆ??/p>
    </div>

    {/* KPI */}
    <section>
      <h2 className="font-semibold mb-3">?Œí¬?Œë ˆ?´ìŠ¤ ê°œìš”</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon="?‘" label="?„ì²´ ?Œí¬?Œë¡œ?? count={0} color="#374151" />
        <KpiCard icon="?? label="?•ìƒ ?Œí¬?Œë¡œ?? count={0} color="#2eb146" />
        <KpiCard icon="?? label="?¼ì‹œ ì¤‘ì?" count={0} color="#f0a72f" />
        <KpiCard icon="?? label="?¤ë¥˜ ?Œí¬?Œë¡œ?? count={0} color="#e43c3c" />
      </div>
    </section>

    {/* Latest updates */}
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">ìµœê·¼ ?…ë°?´íŠ¸</h2>
        <button className="text-sm text-blue-500 hover:underline">??ë³´ê¸°</button>
      </div>
      <div className="border rounded-xl divide-y bg-white dark:bg-gray-800">
        <div className="p-3 text-sm text-gray-400 text-center">?…ë°?´íŠ¸ ?´ì—­???†ìŠµ?ˆë‹¤</div>
      </div>
    </section>

    {/* Top workflows */}
    <section>
      <h2 className="font-semibold mb-3">?ì£¼ ?¬ìš©?˜ëŠ” ?Œí¬?Œë¡œ??/h2>
      <div className="border rounded-xl p-4 bg-white dark:bg-gray-800 text-center text-sm text-gray-400">
        ?°ì´?°ê? ?†ìŠµ?ˆë‹¤
      </div>
    </section>

    {/* Error list */}
    <section>
      <h2 className="font-semibold mb-3">?¤ë¥˜ ëª©ë¡</h2>
      <div className="border rounded-xl p-4 bg-white dark:bg-gray-800 text-center text-sm text-gray-400">
        ë°œìƒ???¤ë¥˜ê°€ ?†ìŠµ?ˆë‹¤
      </div>
    </section>
  </div>
);

export const mainDashboardModule: FeatureModule = {
  id: 'main-Dashboard',
  name: 'Main Dashboard',
  sidebarSection: 'workspace',
  sidebarItems: [
    { id: 'main-dashboard', titleKey: 'sidebar.workspace.mainDashboard.title', descriptionKey: 'sidebar.workspace.mainDashboard.description', icon: 'IconSidebarPlusMore' },
  ],
  routes: { 'main-dashboard': MainDashboard },
};

export default mainDashboardModule;