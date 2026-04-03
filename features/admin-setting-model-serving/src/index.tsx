'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea, useToast } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { FiServer, FiCpu, FiRefreshCw } from '@xgen/icons';
import { createApiClient } from '@xgen/api-client';

// ─────────────────────────────────────────────────────────────
// Constants & Types
// ─────────────────────────────────────────────────────────────

const SS = 'admin.settings.modelServing';

interface GpuInfo {
  gpu_name: string;
  gpu_memory: string;
  gpu_count: number;
}

interface LoadedModel {
  name: string;
  type: string;
  status: string;
}

interface ModelServingStatus {
  gpu_info?: GpuInfo;
  loaded_models?: LoadedModel[];
}

// ─────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────

const AdminSettingModelServingPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [data, setData] = useState<ModelServingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const api = createApiClient();
      const res = await api.get<ModelServingStatus>('/api/model-serving/status');
      setData(res.data);
    } catch {
      setError(t(`${SS}.loadFailed`));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleRetry = () => {
    loadStatus();
  };

  // ── Status badge color ──
  const statusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'running' || s === 'ready' || s === 'loaded') return 'bg-emerald-500/10 text-emerald-600';
    if (s === 'loading' || s === 'initializing') return 'bg-amber-500/10 text-amber-600';
    if (s === 'error' || s === 'failed') return 'bg-destructive/10 text-destructive';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">{t(`${SS}.title`)}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t(`${SS}.description`)}</p>
          </div>
          <button
            onClick={handleRetry}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {t(`${SS}.refresh`)}
          </button>
        </div>

        {/* Loading State */}
        {loading && !data && (
          <div className="flex items-center justify-center rounded-lg border border-border bg-card p-12">
            <span className="text-sm text-muted-foreground">{t(`${SS}.loading`)}</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <button
              onClick={handleRetry}
              className="rounded-md border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {t(`${SS}.retry`)}
            </button>
          </div>
        )}

        {/* Data Display */}
        {data && !loading && (
          <>
            {/* GPU Environment Card */}
            {data.gpu_info && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
                  <FiCpu className="h-4 w-4 text-primary" />
                  {t(`${SS}.gpuEnvironment`)}
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">{t(`${SS}.gpu.name`)}</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{data.gpu_info.gpu_name}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">{t(`${SS}.gpu.memory`)}</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{data.gpu_info.gpu_memory}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">{t(`${SS}.gpu.count`)}</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{data.gpu_info.gpu_count}</p>
                  </div>
                </div>
              </section>
            )}

            {/* Loaded Models */}
            {data.loaded_models && data.loaded_models.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
                  <FiServer className="h-4 w-4 text-primary" />
                  {t(`${SS}.loadedModels`)}
                </h2>
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">{t(`${SS}.model.name`)}</th>
                        <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">{t(`${SS}.model.type`)}</th>
                        <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">{t(`${SS}.model.status`)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.loaded_models.map((model) => (
                        <tr key={model.name} className="border-b border-border last:border-b-0 bg-card">
                          <td className="px-4 py-2.5 font-medium text-foreground">{model.name}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{model.type}</td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(model.status)}`}>
                              {model.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Coming Soon: Download / Deploy */}
            <section>
              <h2 className="mb-3 text-base font-semibold text-foreground">{t(`${SS}.deployManagement`)}</h2>
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <FiServer className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{t(`${SS}.comingSoon`)}</h3>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  Model download and deployment management features are being prepared.
                </p>
              </div>
            </section>
          </>
        )}

        {/* No data, no error */}
        {!data && !loading && !error && (
          <div className="flex items-center justify-center rounded-lg border border-border bg-card p-8">
            <span className="text-sm text-muted-foreground">{t(`${SS}.noData`)}</span>
          </div>
        )}
      </div>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Module
// ─────────────────────────────────────────────────────────────

const feature: AdminFeatureModule = {
  id: 'admin-setting-model-serving',
  name: 'AdminSettingModelServing',
  adminSection: 'admin-setting',
  routes: {
    'admin-setting-model-serving': AdminSettingModelServingPage,
  },
};

export default feature;
