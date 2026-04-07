'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea, Button, StatCard, ScrollableFilterTabs, ConfigCard, useToast } from '@xgen/ui';
import type { FilterTab, ConfigValueType } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { FiRefreshCw } from '@xgen/icons';

import { fetchAllConfigs, updateConfig } from './api/config-api';
import type { ConfigItem } from './types';
import { CV, CATEGORY_ORDER } from './constants';
import {
  getConfigCategory, getCategoryIcon, getCategoryColor,
  formatValue, getValueType, validateValue,
} from './utils';

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

  // ── Data fetching ──

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

  // ── Computed: stats & category counts ──

  const stats = useMemo(() => {
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

  // ── Computed: FilterTabs config ──

  const filterTabs: FilterTab[] = useMemo(() => {
    const tabs: FilterTab[] = [
      { key: 'all', label: t(`${CV}.all`), count: stats.total },
    ];
    CATEGORY_ORDER.forEach((cat) => {
      if ((stats[cat] || 0) > 0) {
        tabs.push({
          key: cat,
          label: t(`${CV}.categories.${cat}`),
          count: stats[cat],
          icon: React.createElement('span', { style: { color: getCategoryColor(cat) } }, getCategoryIcon(cat)),
        });
      }
    });
    return tabs;
  }, [stats, t]);

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

  // ── Loading / Error states ──

  if (loading && configs.length === 0) {
    return (
      <ContentArea title={t(`${CV}.title`)} description={t(`${CV}.subtitle`)}>
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <FiRefreshCw className="h-8 w-8 animate-spin" />
          <p className="text-sm">{t(`${CV}.loading`)}</p>
        </div>
      </ContentArea>
    );
  }

  if (error && configs.length === 0) {
    return (
      <ContentArea title={t(`${CV}.title`)} description={t(`${CV}.subtitle`)}>
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="primary" onClick={loadConfigs}>{t(`${CV}.retry`)}</Button>
        </div>
      </ContentArea>
    );
  }

  // ── Main render ──

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
      toolbar={
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label={t(`${CV}.totalSettings`)}
            value={stats.total}
            variant="info"
            loading={loading}
          />
          <StatCard
            label={t(`${CV}.savedSettings`)}
            value={stats.saved}
            variant="success"
            loading={loading}
          />
          <StatCard
            label={t(`${CV}.defaultSettings`)}
            value={stats.unsaved}
            variant="neutral"
            loading={loading}
          />
        </div>
      }
      subToolbar={
        <ScrollableFilterTabs
          tabs={filterTabs}
          activeKey={filter}
          onChange={setFilter}
          variant="pills"
          size="sm"
        />
      }
    >
      {/* Config List */}
      <div className="flex flex-col gap-2.5">
        {filteredConfigs.map((config) => {
          const category = getConfigCategory(config.config_path);
          const isEditing = editingConfig === config.env_name;
          const isModified = config.is_saved && config.current_value !== config.default_value;

          return (
            <ConfigCard
              key={config.env_name}
              envName={config.env_name}
              configPath={config.config_path}
              currentValue={formatValue(config.current_value, config.env_name)}
              defaultValue={formatValue(config.default_value, config.env_name)}
              valueType={config.type as ConfigValueType}
              isModified={isModified}
              icon={getCategoryIcon(category)}
              accentColor={getCategoryColor(category)}
              statusLabel={isModified ? t(`${CV}.configured`) : t(`${CV}.defaultValue`)}
              currentValueLabel={t(`${CV}.currentValue`)}
              defaultValueLabel={t(`${CV}.defaultValueLabel`)}
              editing={isEditing}
              editValue={editValue}
              saving={updating}
              onEditStart={() => handleEditStart(config)}
              onEditChange={setEditValue}
              onSave={() => handleEditSave(config)}
              onCancel={handleEditCancel}
            />
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
  sidebarItems: [
    { id: 'admin-system-config', titleKey: 'admin.sidebar.setting.systemConfig.title', descriptionKey: 'admin.sidebar.setting.systemConfig.description' },
  ],
  routes: {
    'admin-system-config': AdminSystemConfigPage,
  },
};

export default feature;
