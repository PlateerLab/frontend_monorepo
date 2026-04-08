'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { GovMonitoringTabPlugin, GovMonitoringTabPluginProps } from '@xgen/types';
import { Button, Modal, StatCard } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import {
  getMonitoringAgentflows,
  getOverdueInspections,
  createInspection,
  type AgentflowSummary,
  type OverdueItem,
  type InspectionCycle,
  type InspectionType,
  type InspectionResult,
} from '@xgen/api-client';

/* ── Constants ───────────────────────────────────────────── */
const RESULT_CONFIG: Record<InspectionResult, { color: string; bg: string; label: string }> = {
  'normal':            { color: '#16a34a', bg: 'rgba(22,163,74,0.08)',   label: '정상' },
  'needs-improvement': { color: '#ca8a04', bg: 'rgba(202,138,4,0.08)',   label: '보완 필요' },
  'urgent-action':     { color: '#dc2626', bg: 'rgba(220,38,38,0.08)',   label: '긴급 조치' },
  'incomplete':        { color: '#64748b', bg: 'rgba(100,116,139,0.08)', label: '미완료' },
};

const CYCLE_OPTIONS: InspectionCycle[] = ['monthly', 'quarterly', 'semi-annual', 'annual'];
const TYPE_OPTIONS: InspectionType[] = ['regular', 'ad-hoc', 'emergency'];
const RESULT_OPTIONS: InspectionResult[] = ['normal', 'needs-improvement', 'urgent-action', 'incomplete'];

const CYCLE_LABELS: Record<InspectionCycle, string> = {
  'monthly': '월별',
  'quarterly': '분기별',
  'semi-annual': '반기별',
  'annual': '연간',
};

const TYPE_LABELS: Record<InspectionType, string> = {
  'regular': '정기점검',
  'ad-hoc': '수시점검',
  'emergency': '긴급점검',
};

interface FormData {
  workflow_id: string;
  inspection_cycle: InspectionCycle;
  inspection_type: InspectionType;
  inspection_date: string;
  next_inspection_date: string;
  inspection_result: InspectionResult;
  inspection_items: string;
  inspection_content: string;
  issue_management: string;
  applicable_scope: string;
}

const EMPTY_FORM: FormData = {
  workflow_id: '',
  inspection_cycle: 'quarterly',
  inspection_type: 'regular',
  inspection_date: '',
  next_inspection_date: '',
  inspection_result: 'normal',
  inspection_items: '',
  inspection_content: '',
  issue_management: '',
  applicable_scope: '',
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

/* ── Component ───────────────────────────────────────────── */
const GovMonitoringOverdue: React.FC<GovMonitoringTabPluginProps> = ({ onSubToolbarChange }) => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [overdueList, setOverdueList] = useState<OverdueItem[]>([]);
  const [workflows, setAgentflows] = useState<AgentflowSummary[]>([]);

  const [showFormModal, setShowFormModal] = useState(false);
  const [formData, setFormData] = useState<FormData>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const loadOverdue = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOverdueInspections();
      setOverdueList(Array.isArray(data) ? data : []);
    } catch {
      setOverdueList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverdue();
  }, [loadOverdue]);

  /* ── SubToolbar: overdue count stat ── */
  const overdueStats = useMemo(() => {
    const criticalCount = overdueList.filter((item) => item.overdueDays >= 30).length;
    return { total: overdueList.length, critical: criticalCount };
  }, [overdueList]);

  useEffect(() => {
    if (overdueList.length > 0) {
      onSubToolbarChange?.(
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            label={t('admin.governance.monitoring.overdueTotal', 'Overdue Total')}
            value={overdueStats.total}
            accentColor="#dc2626"
          />
          <StatCard
            label={t('admin.governance.monitoring.overdueCritical', 'Critical (30+ days)')}
            value={overdueStats.critical}
            accentColor="#991b1b"
          />
        </div>
      );
    } else {
      onSubToolbarChange?.(null);
    }
  }, [overdueStats, overdueList.length, onSubToolbarChange, t]);

  /* ── Handlers ── */
  const openFormForOverdue = useCallback(async (item: OverdueItem) => {
    setFormData({ ...EMPTY_FORM, workflow_id: item.workflowId });
    if (workflows.length === 0) {
      try {
        const data = await getMonitoringAgentflows();
        setAgentflows(Array.isArray(data) ? data : []);
      } catch { /* ignore */ }
    }
    setShowFormModal(true);
  }, [workflows.length]);

  const handleSave = useCallback(async () => {
    if (!formData.workflow_id || !formData.inspection_date) return;

    setSaving(true);
    try {
      await createInspection(formData);
      setShowFormModal(false);
      setFormData({ ...EMPTY_FORM });
      loadOverdue();
    } catch {
      // error handled by API layer
    } finally {
      setSaving(false);
    }
  }, [formData, loadOverdue]);

  /* ── Render: Form Modal ── */
  const renderFormModal = useCallback(() => {
    if (!showFormModal) return null;

    return (
      <Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={t('admin.governance.monitoring.addInspection', '점검 등록')}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowFormModal(false)}>
              {t('admin.governance.common.cancel', 'Cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formData.workflow_id || !formData.inspection_date}
            >
              {saving ? '...' : t('admin.governance.common.save', 'Save')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('admin.governance.monitoring.selectAgentflow', 'Agentflow')}
            </label>
            <select
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
              value={formData.workflow_id}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData((prev: FormData) => ({ ...prev, workflow_id: e.target.value }))}
            >
              <option value="">{t('admin.governance.monitoring.workflowPlaceholder', 'Select workflow...')}</option>
              {workflows.map((wf: AgentflowSummary) => (
                <option key={wf.workflowId} value={wf.workflowId}>{wf.workflowName}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('admin.governance.monitoring.inspectionCycle', 'Cycle')}
              </label>
              <select
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                value={formData.inspection_cycle}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData((prev: FormData) => ({ ...prev, inspection_cycle: e.target.value as InspectionCycle }))}
              >
                {CYCLE_OPTIONS.map((c: InspectionCycle) => <option key={c} value={c}>{CYCLE_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('admin.governance.monitoring.inspectionDate', 'Date')}
              </label>
              <input
                type="date"
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                value={formData.inspection_date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev: FormData) => ({ ...prev, inspection_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('admin.governance.monitoring.inspectionType', 'Type')}
              </label>
              <select
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                value={formData.inspection_type}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData((prev: FormData) => ({ ...prev, inspection_type: e.target.value as InspectionType }))}
              >
                {TYPE_OPTIONS.map((typeVal: InspectionType) => <option key={typeVal} value={typeVal}>{TYPE_LABELS[typeVal]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('admin.governance.monitoring.result', 'Result')}
              </label>
              <select
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                value={formData.inspection_result}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData((prev: FormData) => ({ ...prev, inspection_result: e.target.value as InspectionResult }))}
              >
                {RESULT_OPTIONS.map((r: InspectionResult) => <option key={r} value={r}>{RESULT_CONFIG[r].label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('admin.governance.monitoring.nextInspection', 'Next Inspection')}
            </label>
            <input
              type="date"
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
              value={formData.next_inspection_date}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev: FormData) => ({ ...prev, next_inspection_date: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('admin.governance.monitoring.inspectionItems', 'Items')}
            </label>
            <input
              type="text"
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
              value={formData.inspection_items}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev: FormData) => ({ ...prev, inspection_items: e.target.value }))}
              placeholder={t('admin.governance.monitoring.inspectionItemsPlaceholder', 'e.g. Security, Data integrity, Access control')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('admin.governance.monitoring.inspectionContent', 'Content')}
            </label>
            <textarea
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground resize-y"
              value={formData.inspection_content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData((prev: FormData) => ({ ...prev, inspection_content: e.target.value }))}
              placeholder={t('admin.governance.monitoring.inspectionContentPlaceholder', 'Describe the inspection content...')}
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('admin.governance.monitoring.issueManagement', 'Issue Management')}
            </label>
            <textarea
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground resize-y"
              value={formData.issue_management}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData((prev: FormData) => ({ ...prev, issue_management: e.target.value }))}
              placeholder={t('admin.governance.monitoring.issueManagementPlaceholder', 'Describe any issues and actions taken...')}
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('admin.governance.monitoring.applicableScope', 'Scope')}
            </label>
            <input
              type="text"
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
              value={formData.applicable_scope}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev: FormData) => ({ ...prev, applicable_scope: e.target.value }))}
              placeholder={t('admin.governance.monitoring.applicableScopePlaceholder', 'e.g. Production, Staging')}
            />
          </div>
        </div>
      </Modal>
    );
  }, [showFormModal, formData, saving, workflows, handleSave, t]);

  /* ── Main render ── */
  return (
    <div className="p-6">
      <p className="text-sm text-muted-foreground mb-4">
        {t('admin.governance.monitoring.overdueDescription', 'List of overdue inspections requiring immediate attention.')}
      </p>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground tracking-wide">{t('admin.governance.common.agentflow', 'Agentflow')}</th>
              <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground tracking-wide">{t('admin.governance.monitoring.inspectionCycle', 'Cycle')}</th>
              <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground tracking-wide">{t('admin.governance.monitoring.expectedDate', 'Expected Date')}</th>
              <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground tracking-wide">{t('admin.governance.monitoring.overdueDays', 'Overdue Days')}</th>
              <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground tracking-wide">{t('admin.governance.monitoring.manager', 'Manager')}</th>
              <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground tracking-wide">{t('admin.governance.common.actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                </td>
              </tr>
            ) : overdueList.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  {t('admin.governance.common.noData', 'No data')}
                </td>
              </tr>
            ) : (
              overdueList.map((item: OverdueItem) => (
                <tr key={item.id} className="border-b border-border hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{item.workflowName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{CYCLE_LABELS[item.inspectionCycle] || item.inspectionCycle}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(item.expectedDate)}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold" style={{ color: '#dc2626' }}>
                      +{item.overdueDays}{t('admin.governance.monitoring.days', '일')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{item.managerName}</td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      onClick={() => openFormForOverdue(item)}
                    >
                      {t('admin.governance.monitoring.addInspection', '점검 등록')}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {renderFormModal()}
    </div>
  );
};

/* ── Plugin Export ── */
export const govMonitoringOverduePlugin: GovMonitoringTabPlugin = {
  id: 'overdue',
  name: 'GovMonitoringOverdue',
  tabLabelKey: 'admin.governance.monitoring.tabs.overdue',
  order: 3,
  component: GovMonitoringOverdue,
};

export default govMonitoringOverduePlugin;
