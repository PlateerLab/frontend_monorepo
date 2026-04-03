'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@xgen/i18n';
import { useToast } from '@xgen/ui';
import { FiEdit3, FiCheck, FiX } from '@xgen/icons';
import { updateConfig } from './config-api';
import type { ConfigItem, FieldConfig } from './types';

// ─────────────────────────────────────────────────────────────

interface BaseConfigPanelProps {
  configData: ConfigItem[];
  fieldConfigs: Record<string, FieldConfig>;
  filterPrefix?: string;
  onTestConnection?: (category: string) => void;
  testConnectionLabel?: string;
  testConnectionCategory?: string;
  onConfigChange?: () => Promise<void>;
  showTestConnection?: boolean;
}

const SS = 'admin.settings';

function validateValue(
  value: string,
  fc: FieldConfig,
): { isValid: boolean; parsedValue: unknown; error?: string } {
  switch (fc.type) {
    case 'number': {
      const n = parseFloat(value);
      if (isNaN(n)) return { isValid: false, parsedValue: null, error: 'Invalid number' };
      if (fc.min !== undefined && n < fc.min) return { isValid: false, parsedValue: null, error: `Min: ${fc.min}` };
      if (fc.max !== undefined && n > fc.max) return { isValid: false, parsedValue: null, error: `Max: ${fc.max}` };
      return { isValid: true, parsedValue: n };
    }
    case 'boolean':
      if (value === 'true') return { isValid: true, parsedValue: true };
      if (value === 'false') return { isValid: true, parsedValue: false };
      return { isValid: false, parsedValue: null, error: 'Invalid boolean' };
    case 'select': {
      const valid = fc.options?.map((o) => o.value) || [];
      if (!valid.includes(value)) return { isValid: false, parsedValue: null, error: 'Invalid option' };
      return { isValid: true, parsedValue: value };
    }
    default:
      return { isValid: true, parsedValue: value };
  }
}

function formatDisplay(value: unknown, fc: FieldConfig): string {
  if (value === null || value === undefined) return 'N/A';
  if (fc.type === 'password' && typeof value === 'string' && value.length > 8) {
    return value.substring(0, 8) + '*'.repeat(Math.min(value.length - 8, 20)) + '...';
  }
  return String(value);
}

// ─────────────────────────────────────────────────────────────

const BaseConfigPanel: React.FC<BaseConfigPanelProps> = ({
  configData = [],
  fieldConfigs,
  filterPrefix,
  onTestConnection,
  testConnectionLabel,
  testConnectionCategory = 'default',
  onConfigChange,
  showTestConnection = true,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [localConfig, setLocalConfig] = useState<Record<string, unknown>>({});
  const [editingConfig, setEditingConfig] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [updating, setUpdating] = useState<Record<string, boolean>>({});

  const uniqueConfigs = React.useMemo(() => {
    const filtered = filterPrefix
      ? configData.filter(
          (item) => item.config_path.startsWith(filterPrefix) || item.env_name.startsWith(filterPrefix),
        )
      : configData;
    const seen = new Set<string>();
    return filtered.filter((item) => {
      if (seen.has(item.env_name)) return false;
      seen.add(item.env_name);
      return true;
    });
  }, [configData, filterPrefix]);

  useEffect(() => {
    const map: Record<string, unknown> = {};
    uniqueConfigs.forEach((item) => { map[item.env_name] = item.current_value; });
    setLocalConfig(map);
  }, [uniqueConfigs]);

  const handleEditStart = (ci: ConfigItem) => {
    setEditingConfig(ci.env_name);
    setEditValue(String(localConfig[ci.env_name] ?? ci.current_value ?? ''));
  };

  const handleEditCancel = () => { setEditingConfig(null); setEditValue(''); };

  const handleKeyPress = (e: React.KeyboardEvent, ci: ConfigItem) => {
    if (e.key === 'Enter') { e.preventDefault(); handleEditSave(ci); }
    else if (e.key === 'Escape') { e.preventDefault(); handleEditCancel(); }
  };

  const handleEditSave = async (ci: ConfigItem) => {
    const fc = fieldConfigs[ci.env_name];
    if (!fc) return;
    const result = validateValue(editValue, fc);
    if (!result.isValid) { toast.error(`${t(`${SS}.invalidValue`)}: ${result.error}`); return; }

    setUpdating((p) => ({ ...p, [ci.env_name]: true }));
    try {
      await updateConfig(ci.env_name, result.parsedValue);
      setLocalConfig((p) => ({ ...p, [ci.env_name]: result.parsedValue }));
      setEditingConfig(null);
      setEditValue('');
    } catch { toast.error(t(`${SS}.updateFailed`)); }
    finally {
      setUpdating((p) => ({ ...p, [ci.env_name]: false }));
      if (onConfigChange) await onConfigChange();
    }
  };

  const inputCls = 'w-full rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

  const renderInput = (ci: ConfigItem, fc: FieldConfig) => {
    if (fc.type === 'select') {
      return (
        <select value={editValue} onChange={(e) => setEditValue(e.target.value)} disabled={updating[ci.env_name]} onKeyDown={(e) => handleKeyPress(e, ci)} autoFocus className={inputCls}>
          <option value="">{t(`${SS}.common.selectPlaceholder`)}</option>
          {fc.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    }
    if (fc.type === 'boolean') {
      return (
        <select value={editValue} onChange={(e) => setEditValue(e.target.value)} disabled={updating[ci.env_name]} onKeyDown={(e) => handleKeyPress(e, ci)} autoFocus className={inputCls}>
          <option value="true">{t(`${SS}.common.enabled`)}</option>
          <option value="false">{t(`${SS}.common.disabled`)}</option>
        </select>
      );
    }
    return (
      <input
        type={fc.type === 'number' ? 'number' : 'text'}
        value={editValue} onChange={(e) => setEditValue(e.target.value)}
        placeholder={fc.placeholder} min={fc.min} max={fc.max} step={fc.step}
        disabled={updating[ci.env_name]} onKeyDown={(e) => handleKeyPress(e, ci)} autoFocus
        className={`${inputCls} ${fc.type === 'password' ? 'font-mono' : ''}`}
      />
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {uniqueConfigs.map((ci) => {
        const fc = fieldConfigs[ci.env_name];
        if (!fc) return null;
        const val = localConfig[ci.env_name] ?? ci.current_value;
        const isEditing = editingConfig === ci.env_name;

        return (
          <div key={ci.env_name} className="rounded-lg border border-border bg-card p-4">
            <div className="mb-2 flex items-center gap-1">
              <span className="text-sm font-semibold text-foreground">{fc.label}</span>
              {fc.required && <span className="text-xs text-destructive">*</span>}
            </div>

            {isEditing ? (
              <div className="flex items-center gap-2">
                <div className="flex-1">{renderInput(ci, fc)}</div>
                <button onClick={() => handleEditSave(ci)} disabled={updating[ci.env_name]} className="rounded p-1.5 text-primary hover:bg-primary/10"><FiCheck className="h-4 w-4" /></button>
                <button onClick={handleEditCancel} disabled={updating[ci.env_name]} className="rounded p-1.5 text-muted-foreground hover:bg-muted"><FiX className="h-4 w-4" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className={`flex-1 text-sm ${fc.type === 'password' ? 'font-mono' : ''} text-foreground`}>{formatDisplay(val, fc)}</span>
                <button onClick={() => handleEditStart(ci)} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><FiEdit3 className="h-3.5 w-3.5" /></button>
              </div>
            )}

            <div className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              {fc.description}
              <br />
              <span className="opacity-60">{t(`${SS}.common.envVar`)}: {ci.env_name} | {t(`${SS}.common.configPath`)}: {ci.config_path}</span>
              {!ci.is_saved && <span className="ml-1 text-amber-500">({t(`${SS}.common.notSaved`)})</span>}
              {updating[ci.env_name] && <span className="ml-1 text-primary">({t(`${SS}.common.saving`)})</span>}
            </div>
          </div>
        );
      })}

      {uniqueConfigs.length > 0 && onTestConnection && showTestConnection && (
        <div className="mt-2">
          <button
            onClick={() => onTestConnection(testConnectionCategory)}
            disabled={!uniqueConfigs.some((c) => c.is_saved)}
            className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            {testConnectionLabel || t(`${SS}.common.testConnection`)}
          </button>
        </div>
      )}
    </div>
  );
};

export default BaseConfigPanel;
