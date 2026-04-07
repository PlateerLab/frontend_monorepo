'use client';

import React, { useState, useMemo } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea, Button } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import {
  FiArrowLeft, FiChevronRight, FiMic, FiServer, FiDatabase,
} from '@xgen/icons';
import { SiOpenai, BsDatabaseUp, BsGpuCard, IoDocumentLock } from '@xgen/icons';

// ─────────────────────────────────────────────────────────────
// Sub-feature imports — each is an independent package
// ─────────────────────────────────────────────────────────────

import llmMod from '@xgen/feature-admin-setting-llm';
import vlMod from '@xgen/feature-admin-setting-vl';
import embedMod from '@xgen/feature-admin-setting-embed';
import audioMod from '@xgen/feature-admin-setting-audio';
import guarderMod from '@xgen/feature-admin-setting-guarder';
import vastaiMod from '@xgen/feature-admin-setting-vastai';
import modelServingMod from '@xgen/feature-admin-setting-model-serving';
import databaseMod from '@xgen/feature-admin-setting-database';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const SS = 'admin.settings';

interface SettingLink {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: React.ReactNode;
  color: string;
}

const SETTING_LINKS: SettingLink[] = [
  { id: 'admin-setting-llm', nameKey: `${SS}.categories.llm.name`, descriptionKey: `${SS}.categories.llm.description`, icon: <SiOpenai />, color: '#10a37f' },
  { id: 'admin-setting-vl', nameKey: `${SS}.categories.collection.name`, descriptionKey: `${SS}.categories.collection.description`, icon: <IoDocumentLock />, color: '#7c3aed' },
  { id: 'admin-setting-embed', nameKey: `${SS}.categories.vectordb.name`, descriptionKey: `${SS}.categories.vectordb.description`, icon: <BsDatabaseUp />, color: '#023196' },
  { id: 'admin-setting-audio', nameKey: `${SS}.categories.audiomodel.name`, descriptionKey: `${SS}.categories.audiomodel.description`, icon: <FiMic />, color: '#f59e0b' },
  { id: 'admin-setting-guarder', nameKey: `${SS}.categories.guarder.name`, descriptionKey: `${SS}.categories.guarder.description`, icon: <IoDocumentLock />, color: '#ef4444' },
  { id: 'admin-setting-vastai', nameKey: `${SS}.categories.vastai.name`, descriptionKey: `${SS}.categories.vastai.description`, icon: <BsGpuCard />, color: '#7c3aed' },
  { id: 'admin-setting-model-serving', nameKey: `${SS}.categories.modelServing.name`, descriptionKey: `${SS}.categories.modelServing.description`, icon: <FiServer />, color: '#0ea5e9' },
  { id: 'admin-setting-database', nameKey: `${SS}.categories.database.name`, descriptionKey: `${SS}.categories.database.description`, icon: <FiDatabase />, color: '#059669' },
];

// Sub-feature component map — extracted from each feature module's routes
const SUB_PAGE_MAP: Record<string, React.ComponentType<RouteComponentProps>> = {
  'admin-setting-llm': llmMod.routes['admin-setting-llm'],
  'admin-setting-vl': vlMod.routes['admin-setting-vl'],
  'admin-setting-embed': embedMod.routes['admin-setting-embed'],
  'admin-setting-audio': audioMod.routes['admin-setting-audio'],
  'admin-setting-guarder': guarderMod.routes['admin-setting-guarder'],
  'admin-setting-vastai': vastaiMod.routes['admin-setting-vastai'],
  'admin-setting-model-serving': modelServingMod.routes['admin-setting-model-serving'],
  'admin-setting-database': databaseMod.routes['admin-setting-database'],
};

// ─────────────────────────────────────────────────────────────
// Page Component — Hub with internal sub-feature navigation
// ─────────────────────────────────────────────────────────────

const AdminSystemSettingsPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  const [activeSubPage, setActiveSubPage] = useState<string | null>(null);

  const activeLink = useMemo(
    () => SETTING_LINKS.find((l) => l.id === activeSubPage),
    [activeSubPage],
  );

  // ── Sub-feature view ──
  if (activeSubPage && SUB_PAGE_MAP[activeSubPage]) {
    const SubPageComponent = SUB_PAGE_MAP[activeSubPage];

    return (
      <div className="flex flex-col">
        {/* Back button bar */}
        <div className="border-b border-border bg-card px-6 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveSubPage(null)}
            leftIcon={<FiArrowLeft className="h-4 w-4" />}
          >
            {t(`${SS}.back`)}
            {activeLink && (
              <span className="ml-1 text-foreground">/ {t(activeLink.nameKey)}</span>
            )}
          </Button>
        </div>

        {/* Sub-feature content */}
        <SubPageComponent />
      </div>
    );
  }

  // ── Hub view (card grid) ──
  return (
    <ContentArea
      title={t(`${SS}.title`)}
      description={t(`${SS}.description`)}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SETTING_LINKS.map((link) => (
            <button
              key={link.id}
              className="group flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-sm"
              onClick={() => setActiveSubPage(link.id)}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg"
                style={{ color: link.color, backgroundColor: `${link.color}15` }}
              >
                {link.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-foreground">{t(link.nameKey)}</h3>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{t(link.descriptionKey)}</p>
              </div>
              <FiChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </button>
          ))}
      </div>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Module
// ─────────────────────────────────────────────────────────────

const feature: AdminFeatureModule = {
  id: 'admin-system-settings',
  name: 'AdminSystemSettingsPage',
  adminSection: 'admin-setting',
  sidebarItems: [
    { id: 'admin-system-settings', titleKey: 'admin.sidebar.setting.systemSettings.title', descriptionKey: 'admin.sidebar.setting.systemSettings.description' },
  ],
  routes: {
    'admin-system-settings': AdminSystemSettingsPage,
  },
};

export default feature;
