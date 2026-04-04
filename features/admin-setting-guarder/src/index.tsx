'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea, useToast, Button } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { FiPlus, FiEdit3, FiTrash2, FiCheck, FiX } from '@xgen/icons';
import { createApiClient } from '@xgen/api-client';
import {
  BaseConfigPanel,
  fetchAllConfigs,
  type ConfigItem,
  type FieldConfig,
} from '@xgen/admin-setting-shared';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const SS = 'admin.settings.guarder';

const FIELD_CONFIGS: Record<string, FieldConfig> = {
  GUARDER_ENABLED: {
    label: 'Guarder Enabled',
    type: 'boolean',
    description: 'Enable or disable the guarder module globally.',
    required: false,
  },
  GUARDER_RIGOROUS_FILTER: {
    label: 'Rigorous Filter',
    type: 'boolean',
    description: 'Apply strict content filtering rules.',
    required: false,
  },
  GUARDER_PROVIDER: {
    label: 'Guarder Provider',
    type: 'select',
    description: 'Select the guarder model provider.',
    required: true,
    options: [
      { value: 'qwen3guard', label: 'Qwen3 Guard' },
      { value: 'custom', label: 'Custom' },
    ],
  },
  GUARDER_MODEL_NAME: {
    label: 'Model Name',
    type: 'text',
    placeholder: 'e.g. qwen3-guard-v1',
    description: 'The model name used for guarder inference.',
    required: true,
  },
};

// ─────────────────────────────────────────────────────────────
// PII Types
// ─────────────────────────────────────────────────────────────

interface PiiPolicy {
  policy_name: string;
  regex_pattern: string;
  action: 'mask' | 'block' | 'warn';
}

const PII_ACTION_OPTIONS = [
  { value: 'mask', label: 'Mask' },
  { value: 'block', label: 'Block' },
  { value: 'warn', label: 'Warn' },
] as const;

// ─────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────

const AdminSettingGuarderPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  // ── Config Panel State ──
  const [configData, setConfigData] = useState<ConfigItem[]>([]);
  const [configLoading, setConfigLoading] = useState(true);

  // ── PII State ──
  const [piiList, setPiiList] = useState<PiiPolicy[]>([]);
  const [piiLoading, setPiiLoading] = useState(true);
  const [piiError, setPiiError] = useState<string | null>(null);
  const [editingPii, setEditingPii] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PiiPolicy>({ policy_name: '', regex_pattern: '', action: 'mask' });
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState<PiiPolicy>({ policy_name: '', regex_pattern: '', action: 'mask' });
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch Configs ──
  const loadConfigs = useCallback(async () => {
    setConfigLoading(true);
    try {
      const data = await fetchAllConfigs();
      setConfigData((data?.persistent_summary?.configs ?? []) as ConfigItem[]);
    } catch {
      toast.error(t(`${SS}.configLoadFailed`));
    } finally {
      setConfigLoading(false);
    }
  }, [t, toast]);

  // ── Fetch PII Policies ──
  const loadPiiList = useCallback(async () => {
    setPiiLoading(true);
    setPiiError(null);
    try {
      const api = createApiClient();
      const res = await api.get<PiiPolicy[]>('/api/config/piis/list');
      setPiiList(res.data ?? []);
    } catch {
      setPiiError(t(`${SS}.pii.loadFailed`));
    } finally {
      setPiiLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadConfigs();
    loadPiiList();
  }, [loadConfigs, loadPiiList]);

  // ── PII CRUD ──
  const handleAddPii = async () => {
    if (!addForm.policy_name.trim() || !addForm.regex_pattern.trim()) {
      toast.error(t(`${SS}.pii.validationError`));
      return;
    }
    setSubmitting(true);
    try {
      const api = createApiClient();
      await api.post('/api/config/piis/create', addForm);
      toast.success(t(`${SS}.pii.createSuccess`));
      setIsAdding(false);
      setAddForm({ policy_name: '', regex_pattern: '', action: 'mask' });
      await loadPiiList();
    } catch {
      toast.error(t(`${SS}.pii.createFailed`));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditStart = (policy: PiiPolicy) => {
    setEditingPii(policy.policy_name);
    setEditForm({ ...policy });
  };

  const handleEditSave = async () => {
    if (!editForm.regex_pattern.trim()) {
      toast.error(t(`${SS}.pii.validationError`));
      return;
    }
    setSubmitting(true);
    try {
      const api = createApiClient();
      await api.post('/api/config/piis/update', editForm);
      toast.success(t(`${SS}.pii.updateSuccess`));
      setEditingPii(null);
      await loadPiiList();
    } catch {
      toast.error(t(`${SS}.pii.updateFailed`));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCancel = () => {
    setEditingPii(null);
    setEditForm({ policy_name: '', regex_pattern: '', action: 'mask' });
  };

  const handleDelete = async (name: string) => {
    setSubmitting(true);
    try {
      const api = createApiClient();
      await api.delete(`/api/config/piis/delete/${encodeURIComponent(name)}`);
      toast.success(t(`${SS}.pii.deleteSuccess`));
      await loadPiiList();
    } catch {
      toast.error(t(`${SS}.pii.deleteFailed`));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Styles ──
  const inputCls =
    'w-full rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';
  const selectCls = inputCls;

  return (
    <ContentArea
      title={t(`${SS}.title`)}
      description={t(`${SS}.description`)}
    >
      {/* Section 1: Model Config */}
      <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">{t(`${SS}.modelConfig.title`)}</h2>
          {configLoading ? (
            <div className="flex items-center justify-center rounded-lg border border-border bg-card p-8">
              <span className="text-sm text-muted-foreground">{t(`${SS}.loading`)}</span>
            </div>
          ) : (
            <BaseConfigPanel
              configData={configData}
              fieldConfigs={FIELD_CONFIGS}
              filterPrefix="guarder"
              onConfigChange={loadConfigs}
              showTestConnection={false}
            />
          )}
        </section>

        {/* Section 2: PII Management */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">{t(`${SS}.pii.title`)}</h2>
            {!isAdding && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdding(true)}
                leftIcon={<FiPlus className="h-4 w-4" />}
              >
                {t(`${SS}.pii.add`)}
              </Button>
            )}
          </div>

          {piiError && (
            <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {piiError}
            </div>
          )}

          {/* Add form */}
          {isAdding && (
            <div className="mb-3 rounded-lg border border-primary/30 bg-card p-4">
              <h3 className="mb-3 text-sm font-medium text-foreground">{t(`${SS}.pii.newPolicy`)}</h3>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-muted-foreground">{t(`${SS}.pii.policyName`)}</label>
                  <input
                    type="text"
                    value={addForm.policy_name}
                    onChange={(e) => setAddForm((f) => ({ ...f, policy_name: e.target.value }))}
                    placeholder="e.g. ssn_detector"
                    className={inputCls}
                    disabled={submitting}
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-muted-foreground">{t(`${SS}.pii.regexPattern`)}</label>
                  <input
                    type="text"
                    value={addForm.regex_pattern}
                    onChange={(e) => setAddForm((f) => ({ ...f, regex_pattern: e.target.value }))}
                    placeholder="e.g. \\d{3}-\\d{2}-\\d{4}"
                    className={inputCls}
                    disabled={submitting}
                  />
                </div>
                <div className="w-full sm:w-32">
                  <label className="mb-1 block text-xs text-muted-foreground">{t(`${SS}.pii.action`)}</label>
                  <select
                    value={addForm.action}
                    onChange={(e) => setAddForm((f) => ({ ...f, action: e.target.value as PiiPolicy['action'] }))}
                    className={selectCls}
                    disabled={submitting}
                  >
                    {PII_ACTION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleAddPii}
                    disabled={submitting}
                    className="text-primary hover:bg-primary/10"
                  >
                    <FiCheck className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setIsAdding(false); setAddForm({ policy_name: '', regex_pattern: '', action: 'mask' }); }}
                    disabled={submitting}
                  >
                    <FiX className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* PII List */}
          {piiLoading ? (
            <div className="flex items-center justify-center rounded-lg border border-border bg-card p-8">
              <span className="text-sm text-muted-foreground">{t(`${SS}.loading`)}</span>
            </div>
          ) : piiList.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg border border-border bg-card p-8">
              <span className="text-sm text-muted-foreground">{t(`${SS}.pii.empty`)}</span>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-2.5 text-left font-semibold text-xs text-muted-foreground tracking-wide">{t(`${SS}.pii.policyName`)}</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-xs text-muted-foreground tracking-wide">{t(`${SS}.pii.regexPattern`)}</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-xs text-muted-foreground tracking-wide">{t(`${SS}.pii.action`)}</th>
                    <th className="px-4 py-2.5 text-right font-semibold text-xs text-muted-foreground tracking-wide">{t(`${SS}.pii.actions`)}</th>
                  </tr>
                </thead>
                <tbody>
                  {piiList.map((policy) => {
                    const isEditing = editingPii === policy.policy_name;

                    return (
                      <tr key={policy.policy_name} className="border-b border-border last:border-b-0 bg-card">
                        {isEditing ? (
                          <>
                            <td className="px-4 py-2">
                              <span className="text-sm font-medium text-foreground">{policy.policy_name}</span>
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={editForm.regex_pattern}
                                onChange={(e) => setEditForm((f) => ({ ...f, regex_pattern: e.target.value }))}
                                className={inputCls}
                                disabled={submitting}
                              />
                            </td>
                            <td className="px-4 py-2">
                              <select
                                value={editForm.action}
                                onChange={(e) => setEditForm((f) => ({ ...f, action: e.target.value as PiiPolicy['action'] }))}
                                className={selectCls}
                                disabled={submitting}
                              >
                                {PII_ACTION_OPTIONS.map((o) => (
                                  <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-2 text-right">
                              <div className="inline-flex gap-1">
                                <Button variant="ghost" size="icon" onClick={handleEditSave} disabled={submitting} className="text-primary hover:bg-primary/10">
                                  <FiCheck className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={handleEditCancel} disabled={submitting}>
                                  <FiX className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-2.5 font-medium text-foreground">{policy.policy_name}</td>
                            <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{policy.regex_pattern}</td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                                policy.action === 'block' ? 'bg-destructive/10 text-destructive' :
                                policy.action === 'mask' ? 'bg-amber-500/10 text-amber-600' :
                                'bg-blue-500/10 text-blue-600'
                              }`}>
                                {policy.action}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <div className="inline-flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleEditStart(policy)} disabled={submitting}>
                                  <FiEdit3 className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="danger" size="icon" onClick={() => handleDelete(policy.policy_name)} disabled={submitting}>
                                  <FiTrash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
      </section>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Module
// ─────────────────────────────────────────────────────────────

const feature: AdminFeatureModule = {
  id: 'admin-setting-guarder',
  name: 'AdminSettingGuarder',
  adminSection: 'admin-setting',
  routes: {
    'admin-setting-guarder': AdminSettingGuarderPage,
  },
};

export default feature;
