'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea, Button, StatusBadge } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import {
  listGPUs,
  loadModel,
  unloadModel,
  unloadAllModels,
  listModels,
  checkModelHealth,
  getLoadingStatus,
  getDefaultModelConfig,
  type GPUListItem,
  type GPUListResponse,
  type ModelBackend,
  type ModelInfo,
  type ModelHealthStatus,
  type LoadingStatusResponse,
} from '@xgen/api-client';

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
const AdminMlModelControlPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();

  // Data state
  const [gpus, setGpus] = useState<GPUListItem[]>([]);
  const [multiGpu, setMultiGpu] = useState(false);
  const [health, setHealth] = useState<ModelHealthStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<LoadingStatusResponse | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load form state
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'llm' | 'embedding'>('llm');
  const [formBackend, setFormBackend] = useState<ModelBackend>('llamacpp');
  const [formModelPath, setFormModelPath] = useState('');
  const [formGpuLayers, setFormGpuLayers] = useState(35);
  const [formGpuIds, setFormGpuIds] = useState<number[]>([]);
  const [formContextLength, setFormContextLength] = useState(4096);
  const [submitting, setSubmitting] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshData = useCallback(async () => {
    try {
      const [healthResp, modelsResp, statusResp] = await Promise.all([
        checkModelHealth().catch(() => null),
        listModels().catch(() => ({ data: [], object: 'list' })),
        getLoadingStatus().catch(() => null),
      ]);
      setHealth(healthResp);
      setModels(modelsResp.data);
      setLoadingStatus(statusResp);
      setError(null);
    } catch {
      setError('Failed to fetch model status');
    }
  }, []);

  const loadGPUs = useCallback(async () => {
    try {
      const resp = await listGPUs();
      setGpus(resp.gpus);
      setMultiGpu(resp.multi_gpu);
      if (resp.gpus.length > 0) setFormGpuIds([resp.gpus[0].id]);
    } catch { /* no GPU info available */ }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([refreshData(), loadGPUs()]);
      try {
        const config = await getDefaultModelConfig();
        setFormGpuLayers(config.gpu_layers);
        setFormContextLength(config.context_length);
      } catch { /* use defaults */ }
      setLoading(false);
    })();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, [refreshData, loadGPUs]);

  const handleLoad = useCallback(async () => {
    if (!formModelPath.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await loadModel({
        model_path: formModelPath.trim(),
        backend: formBackend,
        gpu_layers: formBackend !== 'cpu' ? formGpuLayers : undefined,
        gpu_ids: formGpuIds.length > 0 && formBackend !== 'cpu' ? formGpuIds : undefined,
        context_length: formContextLength,
      });
      setShowForm(false);
      setFormModelPath('');

      // Fast poll during loading
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        const status = await getLoadingStatus().catch(() => null);
        setLoadingStatus(status);
        const isLoading = status?.llm?.loading || status?.embedding?.loading;
        if (!isLoading && pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
          refreshData();
        }
      }, 1000);

      // Safety timeout
      setTimeout(() => {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      }, 300000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load model');
    } finally {
      setSubmitting(false);
    }
  }, [formModelPath, formBackend, formGpuLayers, formGpuIds, formContextLength, refreshData]);

  const handleUnload = useCallback(async (modelId: string) => {
    if (!confirm(t('admin.ml.confirmUnload', 'Unload this model?'))) return;
    try {
      await unloadModel(modelId);
      refreshData();
    } catch {
      setError('Failed to unload model');
    }
  }, [refreshData, t]);

  const handleUnloadAll = useCallback(async () => {
    if (!confirm(t('admin.ml.confirmUnloadAll', 'Unload ALL models?'))) return;
    try {
      await unloadAllModels();
      refreshData();
    } catch {
      setError('Failed to unload models');
    }
  }, [refreshData, t]);

  const isAnythingLoading = loadingStatus?.llm?.loading || loadingStatus?.embedding?.loading;

  const formatBytes = (bytes: number) => {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(0)} MB`;
    return `${bytes} B`;
  };

  return (
    <ContentArea
      title={t('admin.pages.mlModelControl.title', 'ML Model Control')}
      description={t('admin.pages.mlModelControl.description', 'GPU management and model serving control')}
      headerActions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshData}>
            {t('common.refresh', 'Refresh')}
          </Button>
          {models.length > 0 && (
            <Button variant="danger" size="sm" onClick={handleUnloadAll}>
              {t('admin.ml.unloadAll', 'Unload All')}
            </Button>
          )}
          <Button size="sm" onClick={() => setShowForm(v => !v)}>
            {showForm ? t('common.cancel', 'Cancel') : t('admin.ml.loadModel', '+ Load Model')}
          </Button>
        </div>
      }
    >
      {/* Error Banner */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <Button variant="danger" size="icon" onClick={() => setError(null)} className="ml-4">✕</Button>
          </div>
        )}

        {/* GPU Cards */}
        {gpus.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">{t('admin.ml.gpuStatus', 'GPU Status')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {gpus.map(gpu => {
                const memPercent = gpu.memory_total > 0 ? (gpu.memory_used / gpu.memory_total) * 100 : 0;
                return (
                  <div key={gpu.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-foreground">GPU {gpu.id}</span>
                      <span className="text-xs text-muted-foreground">{gpu.temperature}°C</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mb-2">{gpu.name}</p>
                    <div className="space-y-1.5">
                      <div>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-muted-foreground">{t('admin.ml.memory', 'Memory')}</span>
                          <span className="text-foreground">{formatBytes(gpu.memory_used)} / {formatBytes(gpu.memory_total)}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${memPercent > 90 ? 'bg-red-500' : memPercent > 70 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${memPercent}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-muted-foreground">{t('admin.ml.utilization', 'Utilization')}</span>
                          <span className="text-foreground">{gpu.utilization}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${gpu.utilization}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Health Status */}
        <div className="grid grid-cols-2 gap-4">
          {/* LLM Status */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground">LLM</h3>
              <StatusBadge status={health?.llm?.loaded ? 'success' : 'warning'}>
                {health?.llm?.loaded ? t('admin.ml.loaded', 'Loaded') : t('admin.ml.notLoaded', 'Not Loaded')}
              </StatusBadge>
            </div>
            {health?.llm?.loaded && (
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>{t('admin.ml.model', 'Model')}: <span className="text-foreground font-mono">{health.llm.model}</span></p>
                <p>{t('admin.ml.backend', 'Backend')}: <span className="text-foreground">{health.llm.backend}</span></p>
              </div>
            )}
            {loadingStatus?.llm?.loading && (
              <div className="mt-2">
                <div className="flex items-center gap-2 text-xs text-blue-600 mb-1">
                  <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  {t('admin.ml.loading', 'Loading')} {loadingStatus.llm.model}...
                </div>
                {loadingStatus.llm.progress !== undefined && (
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${loadingStatus.llm.progress}%` }} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Embedding Status */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground">Embedding</h3>
              <StatusBadge status={health?.embedding?.loaded ? 'success' : 'warning'}>
                {health?.embedding?.loaded ? t('admin.ml.loaded', 'Loaded') : t('admin.ml.notLoaded', 'Not Loaded')}
              </StatusBadge>
            </div>
            {health?.embedding?.loaded && (
              <p className="text-xs text-muted-foreground">{t('admin.ml.model', 'Model')}: <span className="text-foreground font-mono">{health.embedding.model}</span></p>
            )}
            {loadingStatus?.embedding?.loading && (
              <div className="mt-2">
                <div className="flex items-center gap-2 text-xs text-blue-600 mb-1">
                  <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  {t('admin.ml.loading', 'Loading')} {loadingStatus.embedding.model}...
                </div>
                {loadingStatus.embedding.progress !== undefined && (
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${loadingStatus.embedding.progress}%` }} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Load Model Form */}
        {showForm && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">{t('admin.ml.loadNewModel', 'Load New Model')}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground">{t('admin.ml.modelType', 'Model Type')}</label>
                <select value={formType} onChange={e => setFormType(e.target.value as 'llm' | 'embedding')} className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="llm">LLM</option>
                  <option value="embedding">Embedding</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{t('admin.ml.backend', 'Backend')}</label>
                <select value={formBackend} onChange={e => setFormBackend(e.target.value as ModelBackend)} className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="llamacpp">llama.cpp</option>
                  <option value="vllm">vLLM</option>
                  <option value="sglang">SGLang</option>
                  <option value="cpu">CPU Only</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground">{t('admin.ml.modelPath', 'Model Path / HuggingFace ID')}</label>
                <input value={formModelPath} onChange={e => setFormModelPath(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary" placeholder="meta-llama/Meta-Llama-3-8B-Instruct-GGUF" />
              </div>
              {formBackend !== 'cpu' && (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground">{t('admin.ml.gpuLayers', 'GPU Layers')}</label>
                    <input type="number" value={formGpuLayers} onChange={e => setFormGpuLayers(Number(e.target.value))} className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary" min={0} max={100} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">{t('admin.ml.contextLength', 'Context Length')}</label>
                    <input type="number" value={formContextLength} onChange={e => setFormContextLength(Number(e.target.value))} className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary" min={512} step={512} />
                  </div>
                  {gpus.length > 0 && (
                    <div className="col-span-2">
                      <label className="text-xs text-muted-foreground mb-2 block">{t('admin.ml.selectGPUs', 'Select GPUs')}</label>
                      <div className="flex gap-2 flex-wrap">
                        {gpus.map(gpu => (
                          <button
                            key={gpu.id}
                            onClick={() => setFormGpuIds(prev =>
                              prev.includes(gpu.id) ? prev.filter(id => id !== gpu.id) : [...prev, gpu.id]
                            )}
                            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                              formGpuIds.includes(gpu.id)
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                            }`}
                          >
                            GPU {gpu.id}: {gpu.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={handleLoad} disabled={submitting || !formModelPath.trim()}>
                {submitting ? t('admin.ml.loadingModel', 'Loading...') : t('admin.ml.loadModel', 'Load Model')}
              </Button>
            </div>
          </div>
        )}

        {/* Loaded Models Table */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">
            {t('admin.ml.loadedModels', 'Loaded Models')}
            <span className="ml-2 text-xs text-muted-foreground font-normal">({models.length})</span>
          </h2>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : models.length === 0 ? (
            <div className="flex items-center justify-center h-32 rounded-xl border border-dashed border-border text-muted-foreground text-sm">
              {t('admin.ml.noModels', 'No models loaded')}
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 text-left">
                    <th className="px-4 py-3 font-semibold text-xs text-muted-foreground tracking-wide">{t('admin.ml.modelId', 'Model ID')}</th>
                    <th className="px-4 py-3 font-semibold text-xs text-muted-foreground tracking-wide">{t('common.type', 'Type')}</th>
                    <th className="px-4 py-3 font-semibold text-xs text-muted-foreground tracking-wide">{t('admin.ml.owner', 'Owner')}</th>
                    <th className="px-4 py-3 font-semibold text-xs text-muted-foreground tracking-wide">{t('common.createdAt', 'Created')}</th>
                    <th className="px-4 py-3 font-semibold text-xs text-muted-foreground tracking-wide w-24">{t('common.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {models.map(m => (
                    <tr key={m.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-foreground">{m.id}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.object}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.owned_by}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(m.created * 1000).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleUnload(m.id)}
                        >
                          {t('admin.ml.unload', 'Unload')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </ContentArea>
  );
};

const feature: AdminFeatureModule = {
  id: 'admin-ml-model-control',
  name: 'AdminMlModelControlPage',
  adminSection: 'admin-ml',
  routes: {
    'admin-ml-model-control': AdminMlModelControlPage,
  },
};

export default feature;
