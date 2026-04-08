'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { GovMonitoringTabPlugin, GovMonitoringTabPluginProps } from '@xgen/types';
import { Button, SearchInput, Modal, StatCard } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import {
  getMonitoringAgentflows,
  getInspections,
  getInspectionDetail,
  createInspection,
  updateInspection,
  deleteInspection,
  type InspectionRecord,
  type AgentflowSummary,
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
const GovMonitoringHistory: React.FC<GovMonitoringTabPluginProps> = ({ onSubToolbarChange }) => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterResult, setFilterResult] = useState<InspectionResult | 'all'>('all');
  const [filterType, setFilterType] = useState<InspectionType | 'all'>('all');
  const [sortField, setSortField] = useState<'inspectionDate' | 'nextInspectionDate' | 'workflowName'>('inspectionDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [workflows, setAgentflows] = useState<AgentflowSummary[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<InspectionRecord | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<InspectionRecord | null>(null);
  const [formData, setFormData] = useState<FormData>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  /* ── Data loading ── */
  const loadInspections = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getInspections();
      setInspections(Array.isArray(data) ? data : []);
    } catch {
      setInspections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInspections();
  }, [loadInspections]);

  /* ── Filtering / sorting ── */
  const filteredInspections = useMemo(() => {
    let result = [...inspections];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r: InspectionRecord) =>
        r.workflowName.toLowerCase().includes(q) ||
        r.managerName.toLowerCase().includes(q) ||
        r.inspectionItems?.toLowerCase().includes(q)
      );
    }
    if (filterResult !== 'all') result = result.filter((r: InspectionRecord) => r.inspectionResult === filterResult);
    if (filterType !== 'all') result = result.filter((r: InspectionRecord) => r.inspectionType === filterType);

    result.sort((a: InspectionRecord, b: InspectionRecord) => {
      let cmp = 0;
      if (sortField === 'inspectionDate') cmp = a.inspectionDate.localeCompare(b.inspectionDate);
      else if (sortField === 'nextInspectionDate') cmp = (a.nextInspectionDate || '').localeCompare(b.nextInspectionDate || '');
      else cmp = a.workflowName.localeCompare(b.workflowName);
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [inspections, searchQuery, filterResult, filterType, sortField, sortDirection]);

  /* ── Stats ── */
  const stats = useMemo(() => {
    const counts: Record<InspectionResult, number> = {
      'normal': 0, 'needs-improvement': 0, 'urgent-action': 0, 'incomplete': 0,
    };
    inspections.forEach((r: InspectionRecord) => {
      if (counts[r.inspectionResult] !== undefined) {
        counts[r.inspectionResult]++;
      }
    });
    return counts;
  }, [inspections]);

  /* ── SubToolbar: summary cards ── */
  useEffect(() => {
    onSubToolbarChange?.(
      <div className="grid grid-cols-4 gap-4">
        {RESULT_OPTIONS.map((result: InspectionResult) => (
          <StatCard
            key={result}
            label={RESULT_CONFIG[result].label}
            value={stats[result]}
            accentColor={RESULT_CONFIG[result].color}
            subtitle={`/ ${inspections.length} ${t('admin.governance.monitoring.cases', '건')}`}
          />
        ))}
      </div>
    );
  }, [stats, inspections.length, onSubToolbarChange, t]);

  /* ── Handlers ── */
  const handleSort = useCallback((field: 'inspectionDate' | 'nextInspectionDate' | 'workflowName') => {
    if (sortField === field) setSortDirection((d: 'asc' | 'desc') => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('desc'); }
  }, [sortField]);

  const openCreateModal = useCallback(async () => {
    setEditingRecord(null);
    setFormData({ ...EMPTY_FORM });
    if (workflows.length === 0) {
      try {
        const data = await getMonitoringAgentflows();
        setAgentflows(Array.isArray(data) ? data : []);
      } catch { /* ignore */ }
    }
    setShowFormModal(true);
  }, [workflows.length]);

  const openEditModal = useCallback((record: InspectionRecord) => {
    setEditingRecord(record);
    setFormData({
      workflow_id: record.workflowId,
      inspection_cycle: record.inspectionCycle,
      inspection_type: record.inspectionType,
      inspection_date: record.inspectionDate,
      next_inspection_date: record.nextInspectionDate || '',
      inspection_result: record.inspectionResult,
      inspection_items: record.inspectionItems || '',
      inspection_content: record.inspectionContent || '',
      issue_management: record.issueManagement || '',
      applicable_scope: record.applicableScope || '',
    });
    setShowFormModal(true);
  }, []);

  const openDetail = useCallback(async (record: InspectionRecord) => {
    try {
      const data = await getInspectionDetail(record.id);
      setSelectedRecord(data);
    } catch {
      setSelectedRecord(record);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!formData.workflow_id && !editingRecord) return;
    if (!formData.inspection_date) return;

    setSaving(true);
    try {
      if (editingRecord) {
        await updateInspection(editingRecord.id, {
          inspectionCycle: formData.inspection_cycle as InspectionCycle,
          inspectionType: formData.inspection_type as InspectionType,
          inspectionDate: formData.inspection_date,
          nextInspectionDate: formData.next_inspection_date || '',
          inspectionResult: formData.inspection_result as InspectionResult,
          inspectionItems: formData.inspection_items,
          inspectionContent: formData.inspection_content,
          issueManagement: formData.issue_management,
          applicableScope: formData.applicable_scope,
        });
      } else {
        await createInspection(formData);
      }
      setShowFormModal(false);
      setFormData({ ...EMPTY_FORM });
      setEditingRecord(null);
      loadInspections();
    } catch {
      // error handled by API layer
    } finally {
      setSaving(false);
    }
  }, [formData, editingRecord, loadInspections]);

  const handleDelete = useCallback(async (id: number) => {
    if (!window.confirm(t('admin.governance.monitoring.deleteConfirm', 'Delete this inspection record?'))) return;
    try {
      await deleteInspection(id);
      loadInspections();
      if (selectedRecord?.id === id) setSelectedRecord(null);
    } catch {
      // error handled by API layer
    }
  }, [loadInspections, selectedRecord?.id, t]);

  /* ── Render: Detail Modal ── */
  const renderDetailModal = useCallback(() => {
    if (!selectedRecord) return null;
    const resultCfg = RESULT_CONFIG[selectedRecord.inspectionResult as InspectionResult];

    return (
      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title={`${selectedRecord.workflowName} - ${t('admin.governance.monitoring.inspectionDetail', 'Inspection Detail')}`}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setSelectedRecord(null)}>
              {t('admin.governance.common.cancel', 'Cancel')}
            </Button>
            <Button onClick={() => { openEditModal(selectedRecord); setSelectedRecord(null); }}>
              {t('admin.governance.common.edit', 'Edit')}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-xs text-muted-foreground">{t('admin.governance.monitoring.inspectionCycle', 'Cycle')}</p>
            <p className="text-sm text-foreground mt-0.5">{CYCLE_LABELS[selectedRecord.inspectionCycle as InspectionCycle] || selectedRecord.inspectionCycle}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('admin.governance.monitoring.inspectionType', 'Type')}</p>
            <p className="text-sm text-foreground mt-0.5">{TYPE_LABELS[selectedRecord.inspectionType as InspectionType] || selectedRecord.inspectionType}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('admin.governance.monitoring.inspectionDate', 'Date')}</p>
            <p className="text-sm text-foreground mt-0.5">{formatDate(selectedRecord.inspectionDate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('admin.governance.monitoring.nextInspection', 'Next Inspection')}</p>
            <p className="text-sm text-foreground mt-0.5">{formatDate(selectedRecord.nextInspectionDate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('admin.governance.monitoring.result', 'Result')}</p>
            <span
              className="inline-block px-2 py-0.5 rounded text-xs font-medium mt-0.5"
              style={{
                color: resultCfg?.color || '#64748b',
                backgroundColor: resultCfg?.bg || 'rgba(100,116,139,0.08)',
              }}
            >
              {resultCfg?.label || selectedRecord.inspectionResult}
            </span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('admin.governance.monitoring.manager', 'Manager')}</p>
            <p className="text-sm text-foreground mt-0.5">{selectedRecord.managerName}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-1">{t('admin.governance.monitoring.inspectionItems', 'Items')}</h4>
            <p className="text-sm text-foreground">{selectedRecord.inspectionItems || '-'}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-1">{t('admin.governance.monitoring.inspectionContent', 'Content')}</h4>
            <p className="text-sm text-foreground">{selectedRecord.inspectionContent || '-'}</p>
          </div>
          {selectedRecord.issueManagement && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-1">{t('admin.governance.monitoring.issueManagement', 'Issue Management')}</h4>
              <p className="text-sm text-foreground">{selectedRecord.issueManagement}</p>
            </div>
          )}
          {selectedRecord.applicableScope && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-1">{t('admin.governance.monitoring.applicableScope', 'Scope')}</h4>
              <p className="text-sm text-foreground">{selectedRecord.applicableScope}</p>
            </div>
          )}
        </div>
      </Modal>
    );
  }, [selectedRecord, openEditModal, t]);

  /* ── Render: Form Modal ── */
  const renderFormModal = useCallback(() => {
    if (!showFormModal) return null;
    const isEdit = !!editingRecord;

    return (
      <Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={isEdit
          ? t('admin.governance.monitoring.editInspection', 'Edit Inspection')
          : t('admin.governance.monitoring.addInspection', '점검 등록')
        }
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowFormModal(false)}>
              {t('admin.governance.common.cancel', 'Cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || (!isEdit && !formData.workflow_id) || !formData.inspection_date}
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
            {isEdit ? (
              <input
                type="text"
                className="w-full h-9 rounded-lg border border-border bg-muted px-3 text-sm text-foreground"
                value={editingRecord?.workflowName || ''}
                disabled
              />
            ) : (
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
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {t('admin.governance.monitoring.selectAgentflowHelp', 'Select the workflow to inspect.')}
            </p>
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
            <p className="text-xs text-muted-foreground mt-1">
              {t('admin.governance.monitoring.nextInspectionHelp', 'Optional. Will be auto-calculated if left empty.')}
            </p>
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
  }, [showFormModal, editingRecord, formData, saving, workflows, handleSave, t]);

  /* ── Main render ── */
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="w-72">
          <SearchInput
            value={searchQuery}
            onChange={(val: string) => setSearchQuery(val)}
            placeholder={t('admin.governance.monitoring.searchPlaceholder', 'Search by workflow, manager...')}
          />
        </div>
        <select
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
          value={filterResult}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterResult(e.target.value as InspectionResult | 'all')}
        >
          <option value="all">{t('admin.governance.monitoring.allResults', 'All Results')}</option>
          {RESULT_OPTIONS.map((r: InspectionResult) => (
            <option key={r} value={r}>{RESULT_CONFIG[r].label}</option>
          ))}
        </select>
        <select
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
          value={filterType}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterType(e.target.value as InspectionType | 'all')}
        >
          <option value="all">{t('admin.governance.monitoring.allTypes', 'All Types')}</option>
          {TYPE_OPTIONS.map((typeVal: InspectionType) => (
            <option key={typeVal} value={typeVal}>{TYPE_LABELS[typeVal]}</option>
          ))}
        </select>
        <div className="ml-auto">
          <Button onClick={openCreateModal}>
            {t('admin.governance.monitoring.addInspection', '점검 등록')}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th
                className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground tracking-wide cursor-pointer hover:text-foreground"
                onClick={() => handleSort('workflowName')}
              >
                {t('admin.governance.common.agentflow', 'Agentflow')}
                {sortField === 'workflowName' && <span className="ml-1">{sortDirection === 'asc' ? '▲' : '▼'}</span>}
              </th>
              <th
                className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground tracking-wide cursor-pointer hover:text-foreground"
                onClick={() => handleSort('inspectionDate')}
              >
                {t('admin.governance.monitoring.lastInspection', 'Last Inspection')}
                {sortField === 'inspectionDate' && <span className="ml-1">{sortDirection === 'asc' ? '▲' : '▼'}</span>}
              </th>
              <th
                className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground tracking-wide cursor-pointer hover:text-foreground"
                onClick={() => handleSort('nextInspectionDate')}
              >
                {t('admin.governance.monitoring.nextInspection', 'Next Inspection')}
                {sortField === 'nextInspectionDate' && <span className="ml-1">{sortDirection === 'asc' ? '▲' : '▼'}</span>}
              </th>
              <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground tracking-wide">
                {t('admin.governance.monitoring.manager', 'Manager')}
              </th>
              <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground tracking-wide">
                {t('admin.governance.monitoring.result', 'Result')}
              </th>
              <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground tracking-wide">
                {t('admin.governance.common.actions', 'Actions')}
              </th>
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
            ) : filteredInspections.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  {t('admin.governance.common.noData', 'No data')}
                </td>
              </tr>
            ) : (
              filteredInspections.map((record: InspectionRecord) => (
                <tr
                  key={record.id}
                  className="border-b border-border hover:bg-muted/40 cursor-pointer transition-colors"
                  onClick={() => openDetail(record)}
                >
                  <td className="px-4 py-3 font-medium text-foreground">{record.workflowName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(record.inspectionDate)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(record.nextInspectionDate)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{record.managerName}</td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        color: RESULT_CONFIG[record.inspectionResult]?.color || '#64748b',
                        backgroundColor: RESULT_CONFIG[record.inspectionResult]?.bg || 'rgba(100,116,139,0.08)',
                      }}
                    >
                      {RESULT_CONFIG[record.inspectionResult]?.label || record.inspectionResult}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t('admin.governance.monitoring.viewDetail', 'View detail')}
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); openDetail(record); }}
                      >
                        🔍
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t('admin.governance.common.edit', 'Edit')}
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); openEditModal(record); }}
                      >
                        ✏️
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-red-500"
                        title={t('admin.governance.common.delete', 'Delete')}
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleDelete(record.id); }}
                      >
                        🗑️
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {renderDetailModal()}
      {renderFormModal()}
    </div>
  );
};

/* ── Plugin Export ── */
export const govMonitoringHistoryPlugin: GovMonitoringTabPlugin = {
  id: 'history',
  name: 'GovMonitoringHistory',
  tabLabelKey: 'admin.governance.monitoring.tabs.inspectionHistory',
  order: 1,
  component: GovMonitoringHistory,
};

export default govMonitoringHistoryPlugin;
