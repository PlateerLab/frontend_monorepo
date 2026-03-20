'use client';
import React from 'react';
import type { FeatureModule, DocumentTabConfig, RouteComponentProps } from '@xgen/types';

/* ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•
   Document Database
   - DB???€?¥ëœ ë¬¸ì„œ ê´€ë¦???
   ?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â•?â• */

/* ?€?€ DocumentDatabaseSection ?€?€ */
const DocumentDatabaseSection: React.FC<RouteComponentProps> = () => (
  <div className="flex flex-col h-full">
    <div className="flex items-center justify-between px-6 py-4 border-b">
      <h2 className="font-semibold">?°ì´?°ë² ?´ìŠ¤ ë¬¸ì„œ</h2>
      <button className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">+ ë¬¸ì„œ ì¶”ê?</button>
    </div>
    <div className="flex-1 overflow-y-auto p-6">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="pb-2 font-medium">?´ë¦„</th>
            <th className="pb-2 font-medium">? í˜•</th>
            <th className="pb-2 font-medium">?¬ê¸°</th>
            <th className="pb-2 font-medium">?ì„±??/th>
            <th className="pb-2 font-medium">?‘ì—…</th>
          </tr>
        </thead>
        <tbody>
          <tr><td colSpan={5} className="text-center text-gray-400 py-12">ë¬¸ì„œê°€ ?†ìŠµ?ˆë‹¤</td></tr>
        </tbody>
      </table>
    </div>
  </div>
);

export const documentDatabaseFeature: FeatureModule = {
  id: 'main-DocumentManagement-Database',
  name: 'Document Database',
  sidebarSection: 'workflow',
  sidebarItems: [],
  routes: {},
};

export const documentDatabaseTab: DocumentTabConfig = {
  id: 'database',
  titleKey: 'documents.tab.database',
  order: 4,
  component: DocumentDatabaseSection,
};

export { DocumentDatabaseSection };
export default documentDatabaseFeature;