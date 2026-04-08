'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { GovMonitoringTabPlugin, GovMonitoringTabPluginProps } from '@xgen/types';
import { Button, Modal } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import {
  getMonitoringAgentflows,
  getInspectionDetail,
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
const GovMonitoringPlan: React.FC<GovMonitoringTabPluginProps> = () => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [workflows, setAgentflows] = useState<AgentflowSummary[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<InspectionRecord | null>(null);

  const loadAgentflows = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMonitoringAgentflows();
      setAgentflows(Array.isArray(data) ? data : []);
    } catch {
      setAgentflows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAgentflows();
  }, [loadAgentflows]);

  const openDetail = useCallback(async (record: InspectionRecord) => {
    try {
      const data = await getInspectionDetail(record.id);
      setSelectedRecord(data);
    } catch {
      setSelectedRecord(record);
    }
  }, []);

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
          <Button variant="outline" onClick={() => setSelectedRecord(null)}>
            {t('admin.governance.common.cancel', 'Cancel')}
          </Button>
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
  }, [selectedRecord, t]);

  /* ── Main render ── */
  return (
    <div className="p-6">
      <p className="text-sm text-muted-foreground mb-4">
        {t('admin.governance.monitoring.planDescription', 'Agentflow inspection plan overview.')}
      </p>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground tracking-wide">{t('admin.governance.common.agentflow', 'Agentflow')}</th>
              <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground tracking-wide">{t('admin.governance.monitoring.inspectionCount', 'Inspection Count')}</th>
              <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground tracking-wide">{t('admin.governance.monitoring.lastInspection', 'Last Inspection')}</th>
              <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground tracking-wide">{t('admin.governance.monitoring.nextInspection', 'Next Inspection')}</th>
              <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground tracking-wide">{t('admin.governance.monitoring.result', 'Result')}</th>
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
            ) : workflows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  {t('admin.governance.common.noData', 'No data')}
                </td>
              </tr>
            ) : (
              workflows.map((wf: AgentflowSummary) => {
                const latest = wf.latestInspection;
                return (
                  <tr key={wf.workflowId} className="border-b border-border hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{wf.workflowName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{wf.inspectionCount}</td>
                    <td className="px-4 py-3 text-muted-foreground">{latest ? formatDate(latest.inspectionDate) : '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{latest ? formatDate(latest.nextInspectionDate) : '-'}</td>
                    <td className="px-4 py-3">
                      {latest ? (
                        <span
                          className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            color: RESULT_CONFIG[latest.inspectionResult]?.color || '#64748b',
                            backgroundColor: RESULT_CONFIG[latest.inspectionResult]?.bg || 'rgba(100,116,139,0.08)',
                          }}
                        >
                          {RESULT_CONFIG[latest.inspectionResult]?.label || latest.inspectionResult}
                        </span>
                      ) : (
                        <span
                          className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                          style={{ color: '#64748b', backgroundColor: 'rgba(100,116,139,0.08)' }}
                        >
                          {t('admin.governance.monitoring.noInspection', 'No inspection')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {latest ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          title={t('admin.governance.monitoring.viewDetail', 'View detail')}
                          onClick={() => openDetail(latest)}
                        >
                          🔍
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {renderDetailModal()}
    </div>
  );
};

/* ── Plugin Export ── */
export const govMonitoringPlanPlugin: GovMonitoringTabPlugin = {
  id: 'plan',
  name: 'GovMonitoringPlan',
  tabLabelKey: 'admin.governance.monitoring.tabs.inspectionPlan',
  order: 2,
  component: GovMonitoringPlan,
};

export default govMonitoringPlanPlugin;
