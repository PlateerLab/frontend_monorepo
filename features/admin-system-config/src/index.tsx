'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea, Button, useToast } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import {
  FiRefreshCw, FiDatabase, FiSettings, FiCpu, FiLayers,
  FiServer, FiEdit3, FiCheck, FiX, FiImage,
} from '@xgen/icons';
import { SiOpenai, SiAnthropic, RiGeminiFill, FaAws, BsDatabaseUp } from '@xgen/icons';

import { fetchAllConfigs, updateConfig } from './api/config-api';
import type { ConfigItem, CategoryType } from './types';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const CV = 'admin.settings.configViewer';

const CATEGORY_ORDER: CategoryType[] = [
  'node', 'workflow', 'app', 'database', 'vectordb',
  'openai', 'gemini', 'anthropic', 'aws', 'vision_language',
];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function getConfigCategory(configPath: string): CategoryType {
  const path = configPath.toLowerCase();
  if (path.startsWith('database.')) return 'database';
  if (path.startsWith('openai.')) return 'openai';
  if (path.startsWith('app.')) return 'app';
  if (path.startsWith('workflow.')) return 'workflow';
  if (path.startsWith('node.')) return 'node';
  if (path.startsWith('vectordb.')) return 'vectordb';
  if (path.startsWith('gemini.')) return 'gemini';
  if (path.startsWith('anthropic.')) return 'anthropic';
  if (path.startsWith('aws.')) return 'aws';
  if (path.startsWith('vision_language.')) return 'vision_language';
  return 'other';
}

function getCategoryIcon(category: CategoryType) {
  const map: Record<CategoryType, React.ReactNode> = {
    database: <FiDatabase />,
    openai: <SiOpenai />,
    app: <FiServer />,
    workflow: <FiLayers />,
    node: <FiCpu />,
    vectordb: <BsDatabaseUp />,
    gemini: <RiGeminiFill />,
    anthropic: <SiAnthropic />,
    aws: <FaAws />,
    vision_language: <FiImage />,
    other: <FiSettings />,
  };
  return map[category] ?? <FiSettings />;
}

function getCategoryColor(category: CategoryType): string {
  const map: Record<CategoryType, string> = {
    database: '#336791', openai: '#10a37f', app: '#0078d4',
    workflow: '#ff6b35', node: '#6366f1', vectordb: '#023196',
    gemini: '#6b5b9a', anthropic: '#a45d7c', aws: '#ff9900',
    vision_language: '#4b8bbe', other: '#6b7280',
  };
  return map[category] ?? '#6b7280';
}

const SENSITIVE_FIELDS = ['API_KEY', 'PASSWORD', 'SECRET', 'TOKEN'];

function isSensitive(envName: string) {
  return SENSITIVE_FIELDS.some((f) => envName.includes(f));
}

function formatValue(value: unknown, envName?: string): string {
  if (value === null || value === undefined) return 'N/A';
  if (envName && isSensitive(envName) && typeof value === 'string' && value.length > 8) {
    return value.substring(0, 8) + '*'.repeat(Math.min(value.length - 8, 20)) + '...';
  }
  if (Array.isArray(value)) return value.join(', ');
  const str = String(value);
  return str.length > 50 ? str.substring(0, 47) + '...' : str;
}

function getValueType(value: unknown): string {
  if (Array.isArray(value)) return 'Array';
  if (typeof value === 'boolean') return 'Bool';
  if (typeof value === 'number') return 'Num';
  if (typeof value === 'string') return 'Str';
  return 'Unknown';
}

function validateValue(
  value: string,
  type: string,
): { isValid: boolean; parsedValue: unknown; error?: string } {
  switch (type.toLowerCase()) {
    case 'bool': {
      const v = value.toLowerCase().trim();
      if (v === 'true') return { isValid: true, parsedValue: true };
      if (v === 'false') return { isValid: true, parsedValue: false };
      return { isValid: false, parsedValue: null, error: 'Must be "true" or "false"' };
    }
    case 'num': {
      const n = Number(value);
      if (isNaN(n)) return { isValid: false, parsedValue: null, error: 'Invalid number' };
      return { isValid: true, parsedValue: n };
    }
    case 'array': {
      try {
        const arr = JSON.parse(value);
        if (Array.isArray(arr)) return { isValid: true, parsedValue: arr };
      } catch {
        // fallback: comma-separated
      }
      const arr = value.split(',').map((s) => s.trim()).filter(Boolean);
      return { isValid: true, parsedValue: arr };
    }
    default:
      return { isValid: true, parsedValue: value };
  }
}

// ─────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────

const AdminSystemConfigPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [editingConfig, setEditingConfig] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadConfigs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllConfigs();
      if (data?.persistent_summary?.configs) {
        const items: ConfigItem[] = (data.persistent_summary.configs as Record<string, unknown>[]).map((c) => ({
          env_name: c.env_name as string,
          config_path: c.config_path as string,
          current_value: c.current_value,
          default_value: c.default_value,
          is_saved: (c.is_saved as boolean) || false,
          type: getValueType(c.current_value),
        }));
        setConfigs(items);
      } else {
        setConfigs([]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : t(`${CV}.unknownError`);
      setError(msg);
      toast.error(t(`${CV}.loadFailed`));
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  // ── Filter stats ──
  const stats = React.useMemo(() => {
    const s: Record<string, number> = { total: configs.length, saved: 0, unsaved: 0 };
    CATEGORY_ORDER.forEach((c) => (s[c] = 0));
    s['other'] = 0;
    configs.forEach((c) => {
      const cat = getConfigCategory(c.config_path);
      s[cat] = (s[cat] || 0) + 1;
    });
    s.saved = configs.filter((c) => c.is_saved && c.current_value !== c.default_value).length;
    s.unsaved = configs.length - s.saved;
    return s;
  }, [configs]);

  const filteredConfigs = filter === 'all'
    ? configs
    : configs.filter((c) => getConfigCategory(c.config_path) === filter);

  // ── Edit handlers ──
  const handleEditStart = (config: ConfigItem) => {
    setEditingConfig(config.env_name);
    const val = config.current_value != null ? config.current_value : '';
    setEditValue(String(val));
  };

  const handleEditCancel = () => {
    setEditingConfig(null);
    setEditValue('');
  };

  const handleEditSave = async (config: ConfigItem) => {
    const result = validateValue(editValue, config.type);
    if (!result.isValid) {
      toast.error(`${t(`${CV}.invalidValue`)}: ${result.error}`);
      return;
    }
    setUpdating(true);
    try {
      await updateConfig(config.env_name, result.parsedValue);
      setConfigs((prev) =>
        prev.map((c) =>
          c.env_name === config.env_name
            ? { ...c, current_value: result.parsedValue, is_saved: true }
            : c,
        ),
      );
      setEditingConfig(null);
      setEditValue('');
    } catch {
      toast.error(t(`${CV}.updateFailed`));
    } finally {
      setUpdating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, config: ConfigItem) => {
    if (e.key === 'Enter') { e.preventDefault(); handleEditSave(config); }
    else if (e.key === 'Escape') { e.preventDefault(); handleEditCancel(); }
  };

  // ── Loading / Error ──
  if (loading && configs.length === 0) {
    return (
      <ContentArea
        title={t(`${CV}.title`)}
        description={t(`${CV}.subtitle`)}
      >
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <FiRefreshCw className="h-8 w-8 animate-spin" />
          <p className="text-sm">{t(`${CV}.loading`)}</p>
        </div>
      </ContentArea>
    );
  }

  if (error && configs.length === 0) {
    return (
      <ContentArea
        title={t(`${CV}.title`)}
        description={t(`${CV}.subtitle`)}
      >
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="primary" onClick={loadConfigs}>{t(`${CV}.retry`)}</Button>
        </div>
      </ContentArea>
    );
  }

  return (
    <ContentArea
      title={t(`${CV}.title`)}
      description={t(`${CV}.subtitle`)}
      headerActions={
        <Button variant="outline" size="sm" onClick={loadConfigs}>
          <FiRefreshCw className="mr-1 h-4 w-4" />
          {t(`${CV}.refresh`)}
        </Button>
      }
    >
      {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: t(`${CV}.totalSettings`), value: stats.total },
            { label: t(`${CV}.savedSettings`), value: stats.saved },
            { label: t(`${CV}.defaultSettings`), value: stats.unsaved },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-card px-4 py-3 text-center">
              <div className="text-lg font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
            onClick={() => setFilter('all')}
          >
            {t(`${CV}.all`)} ({stats.total})
          </button>
          {CATEGORY_ORDER.map(
            (cat) =>
              (stats[cat] || 0) > 0 && (
                <button
                  key={cat}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    filter === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  onClick={() => setFilter(cat)}
                >
                  <span style={{ color: filter === cat ? undefined : getCategoryColor(cat) }}>
                    {getCategoryIcon(cat)}
                  </span>
                  {t(`${CV}.categories.${cat}`)} ({stats[cat]})
                </button>
              ),
          )}
        </div>

        {/* Config List */}
        <div className="flex flex-col gap-2">
          {filteredConfigs.map((config) => {
            const category = getConfigCategory(config.config_path);
            const isEditing = editingConfig === config.env_name;
            const isModified = config.is_saved && config.current_value !== config.default_value;

            return (
              <div key={config.env_name} className="rounded-lg border border-border bg-card p-4">
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span style={{ color: getCategoryColor(category) }} className="text-base">
                      {getCategoryIcon(category)}
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{config.env_name}</h4>
                      <span className="text-[11px] text-muted-foreground">{config.config_path}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                        isModified
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isModified ? t(`${CV}.configured`) : t(`${CV}.defaultValue`)}
                    </span>
                    <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {config.type}
                    </span>
                  </div>
                </div>

                {/* Value row */}
                <div className="mt-2">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <label className="shrink-0 text-xs text-muted-foreground">
                        {t(`${CV}.currentValue`)}:
                      </label>
                      {config.type.toLowerCase() === 'bool' ? (
                        <select
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          disabled={updating}
                          onKeyDown={(e) => handleKeyPress(e, config)}
                          autoFocus
                          className="flex-1 rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground focus:border-primary focus:outline-none"
                        >
                          <option value="true">true</option>
                          <option value="false">false</option>
                        </select>
                      ) : (
                        <input
                          type={config.type.toLowerCase() === 'num' ? 'number' : 'text'}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          disabled={updating}
                          onKeyDown={(e) => handleKeyPress(e, config)}
                          autoFocus
                          className="flex-1 rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground focus:border-primary focus:outline-none"
                        />
                      )}
                      <button
                        onClick={() => handleEditSave(config)}
                        disabled={updating}
                        className="rounded p-1 text-primary hover:bg-primary/10"
                        title={t(`${CV}.save`)}
                      >
                        <FiCheck className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleEditCancel}
                        disabled={updating}
                        className="rounded p-1 text-muted-foreground hover:bg-muted"
                        title={t(`${CV}.cancel`)}
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{t(`${CV}.currentValue`)}:</span>
                      <span className="flex-1 font-mono text-xs text-foreground">
                        {formatValue(config.current_value, config.env_name)}
                      </span>
                      <button
                        onClick={() => handleEditStart(config)}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title={t(`${CV}.editCurrentValue`)}
                      >
                        <FiEdit3 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{t(`${CV}.defaultValueLabel`)}:</span>
                    <span className="font-mono text-xs text-muted-foreground/70">
                      {formatValue(config.default_value, config.env_name)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredConfigs.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {t(`${CV}.noSettings`)}
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
  id: 'admin-system-config',
  name: 'AdminSystemConfigPage',
  adminSection: 'admin-setting',
  routes: {
    'admin-system-config': AdminSystemConfigPage,
  },
};

export default feature;
