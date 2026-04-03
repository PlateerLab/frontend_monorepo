'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea, useToast } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import {
  BaseConfigPanel,
  fetchAllConfigs,
  type ConfigItem,
  type FieldConfig,
} from '@xgen/admin-setting-shared';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const SS = 'admin.settings.vastai';

const FIELD_CONFIGS: Record<string, FieldConfig> = {
  VASTAI_API_KEY: {
    label: 'Vast.ai API Key',
    type: 'password',
    placeholder: 'Enter your Vast.ai API key',
    description: 'API key for authenticating with the Vast.ai platform.',
    required: true,
  },
  VASTAI_DEFAULT_DISK_GB: {
    label: 'Default Disk (GB)',
    type: 'number',
    placeholder: '50',
    description: 'Default disk space allocation in GB for new instances.',
    required: false,
    min: 10,
    max: 500,
    step: 10,
  },
  VASTAI_DEFAULT_GPU_RAM: {
    label: 'Default GPU RAM (GB)',
    type: 'number',
    placeholder: '24',
    description: 'Default GPU memory requirement in GB when searching for instances.',
    required: false,
    min: 8,
    max: 80,
    step: 8,
  },
};

// ─────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────

const AdminSettingVastaiPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [configData, setConfigData] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllConfigs();
      setConfigData((data?.persistent_summary?.configs ?? []) as ConfigItem[]);
    } catch {
      toast.error(t(`${SS}.configLoadFailed`));
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-foreground">{t(`${SS}.title`)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t(`${SS}.description`)}</p>
        </div>

        {/* Config Section */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">{t(`${SS}.config.title`)}</h2>
          {loading ? (
            <div className="flex items-center justify-center rounded-lg border border-border bg-card p-8">
              <span className="text-sm text-muted-foreground">{t(`${SS}.loading`)}</span>
            </div>
          ) : (
            <BaseConfigPanel
              configData={configData}
              fieldConfigs={FIELD_CONFIGS}
              filterPrefix="vastai"
              onConfigChange={loadConfigs}
              showTestConnection={false}
            />
          )}
        </section>

        {/* GPU Management — Coming Soon */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">{t(`${SS}.gpuManagement.title`)}</h2>
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-foreground">{t(`${SS}.gpuManagement.comingSoon`)}</h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Advanced GPU instance management features are being prepared.
            </p>
          </div>
        </section>
      </div>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Module
// ─────────────────────────────────────────────────────────────

const feature: AdminFeatureModule = {
  id: 'admin-setting-vastai',
  name: 'AdminSettingVastai',
  adminSection: 'admin-setting',
  routes: {
    'admin-setting-vastai': AdminSettingVastaiPage,
  },
};

export default feature;
