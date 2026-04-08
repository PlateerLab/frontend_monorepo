'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea, Button, SearchInput, Modal, StatCard } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import {
  getAgentflowRiskAssessments,
  getAgentflowRiskDetail,
  updateRiskAssessment,
  getGovernanceFiles,
  uploadGovernanceFile,
  downloadGovernanceFile,
  deleteGovernanceFile,
  getActiveRiskPolicy,
  type RiskAssessment,
  type RiskLevel,
  type AgentflowDetail,
  type GovernanceFile,
  type RiskChangeHistory,
  type RiskPolicy,
  type RiskPolicyCategory,
} from '@xgen/api-client';

/* ------------------------------------------------------------------ */
/*  Risk level config                                                  */
/* ------------------------------------------------------------------ */
const RISK_LEVEL_CONFIG: Record<RiskLevel, { labelKey: string; color: string; bg: string }> = {
  critical: { labelKey: 'admin.governance.riskManagement.levelCritical', color: '#dc2626', bg: 'rgba(220,38,38,0.08)' },
  high:     { labelKey: 'admin.governance.riskManagement.levelHigh',     color: '#ea580c', bg: 'rgba(234,88,12,0.08)' },
  medium:   { labelKey: 'admin.governance.riskManagement.levelMedium',   color: '#ca8a04', bg: 'rgba(202,138,4,0.08)' },
  low:      { labelKey: 'admin.governance.riskManagement.levelLow',      color: '#16a34a', bg: 'rgba(22,163,74,0.08)' },
};

const RISK_ORDER: Record<RiskLevel, number> = { critical: 0, high: 1, medium: 2, low: 3 };

/* ------------------------------------------------------------------ */
/*  Checklist types & fallback data                                    */
/* ------------------------------------------------------------------ */
interface ChecklistItemLocal {
  id: string;
  name: string;
  maxScore: number;
  riskMitigation: number;
}

interface ChecklistCategoryLocal {
  name: string;
  weight: string;
  items: ChecklistItemLocal[];
}

interface PolicyGradeLevel {
  id: string;
  name: string;
  min_score: number | null;
  max_score: number | null;
  color: string;
  management_policy: string;
}

const FALLBACK_CATEGORIES: ChecklistCategoryLocal[] = [
  {
    name: '합법성 원칙', weight: '20%',
    items: [
      { id: 'legal-1', name: '금융소비자보호법 위반 가능성', maxScore: 8, riskMitigation: 4 },
      { id: 'legal-2', name: 'AI기본법 위반 가능성',          maxScore: 4, riskMitigation: 3 },
      { id: 'legal-3', name: '데이터 관련법 위반 가능성',      maxScore: 4, riskMitigation: 2 },
      { id: 'legal-4', name: '개별 업권법 위반 가능성',        maxScore: 4, riskMitigation: 2 },
    ],
  },
  {
    name: '신뢰성 원칙', weight: '30%',
    items: [
      { id: 'trust-1', name: '품질',       maxScore: 6, riskMitigation: 4 },
      { id: 'trust-2', name: '편향성',     maxScore: 6, riskMitigation: 2 },
      { id: 'trust-3', name: '공정성',     maxScore: 6, riskMitigation: 2 },
      { id: 'trust-4', name: '설명가능성', maxScore: 6, riskMitigation: 1 },
      { id: 'trust-5', name: '성능',       maxScore: 6, riskMitigation: 3 },
    ],
  },
  {
    name: '신의성실 원칙', weight: '20%',
    items: [
      { id: 'faith-1', name: '계약 권리 침해',  maxScore: 6, riskMitigation: 3 },
      { id: 'faith-2', name: '책임 투명성',     maxScore: 6, riskMitigation: 3 },
      { id: 'faith-3', name: '소비자 보호방안', maxScore: 8, riskMitigation: 4 },
    ],
  },
  {
    name: '보안성 원칙', weight: '30%',
    items: [
      { id: 'security-1', name: '보안',       maxScore: 8, riskMitigation: 3 },
      { id: 'security-2', name: '안정성',     maxScore: 8, riskMitigation: 4 },
      { id: 'security-3', name: '위탁/관리',  maxScore: 8, riskMitigation: 3 },
      { id: 'security-4', name: '프라이버시', maxScore: 6, riskMitigation: 3 },
    ],
  },
];

const FALLBACK_GRADE_LEVELS: PolicyGradeLevel[] = [
  { id: 'g1', name: '최고위험', min_score: 75, max_score: null,  color: '#dc2626', management_policy: '즉시 운영 중단 및 전면 재검토' },
  { id: 'g2', name: '고위험',   min_score: 50, max_score: 74,    color: '#ea580c', management_policy: '사용 제한 및 개선 계획 수립' },
  { id: 'g3', name: '중위험',   min_score: 25, max_score: 49,    color: '#ca8a04', management_policy: '조건부 운영 및 정기 모니터링' },
  { id: 'g4', name: '저위험',   min_score: 0,  max_score: 24,    color: '#16a34a', management_policy: '일반 관리' },
];

/* ------------------------------------------------------------------ */
/*  Utility functions                                                  */
/* ------------------------------------------------------------------ */
function findMatchingGrade(score: number, gradeLevels: PolicyGradeLevel[]): PolicyGradeLevel | null {
  for (const g of gradeLevels) {
    const min = g.min_score ?? 0;
    const max = g.max_score;
    if (score >= min && (max === null || score <= max)) return g;
  }
  const sorted = [...gradeLevels].sort((a: PolicyGradeLevel, b: PolicyGradeLevel) => (b.min_score ?? 0) - (a.min_score ?? 0));
  for (const g of sorted) {
    if (score >= (g.min_score ?? 0)) return g;
  }
  return sorted.length > 0 ? sorted[sorted.length - 1] : null;
}

function gradeToRiskLevel(grade: PolicyGradeLevel | null, allGrades: PolicyGradeLevel[]): RiskLevel {
  if (!grade) return 'low';
  const sorted = [...allGrades].sort((a: PolicyGradeLevel, b: PolicyGradeLevel) => (b.min_score ?? 0) - (a.min_score ?? 0));
  const idx = sorted.findIndex((g: PolicyGradeLevel) => g.id === grade.id);
  const total = sorted.length;
  if (total <= 1) return 'low';
  const ratio = idx / (total - 1);
  if (ratio <= 0.25) return 'critical';
  if (ratio <= 0.5) return 'high';
  if (ratio <= 0.75) return 'medium';
  return 'low';
}

function policyToChecklistCategories(policy: RiskPolicy): ChecklistCategoryLocal[] {
  if (!policy?.categories) return FALLBACK_CATEGORIES;
  return policy.categories.map((cat: RiskPolicyCategory) => ({
    name: cat.name,
    weight: cat.weight,
    items: (cat.items || []).map((item: { id: string; label: string }) => ({
      id: item.id,
      name: item.label,
      maxScore: 6,
      riskMitigation: 3,
    })),
  }));
}

function policyToGradeLevels(policy: RiskPolicy): PolicyGradeLevel[] {
  if (!policy?.grade_config) return FALLBACK_GRADE_LEVELS;
  const levels: RiskLevel[] = ['critical', 'high', 'medium', 'low'];
  return levels.map((level: RiskLevel, idx: number) => {
    const cfg = policy.grade_config[level];
    return {
      id: `g${idx + 1}`,
      name: RISK_LEVEL_CONFIG[level].labelKey,
      min_score: cfg?.min ?? null,
      max_score: cfg?.max ?? null,
      color: RISK_LEVEL_CONFIG[level].color,
      management_policy: '',
    };
  });
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
const AdminGovRiskManagementPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();

  /* ── State ──────────────────────── */
  const [records, setRecords] = useState<RiskAssessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<RiskLevel | 'all'>('all');
  const [sortField, setSortField] = useState<'lastModified' | 'riskLevel' | 'workflowName'>('lastModified');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Detail modal
  const [selectedRecord, setSelectedRecord] = useState<RiskAssessment | null>(null);
  const [detailData, setDetailData] = useState<AgentflowDetail | null>(null);
  const [detailFiles, setDetailFiles] = useState<GovernanceFile[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Edit risk level modal
  const [editRecord, setEditRecord] = useState<RiskAssessment | null>(null);
  const [editLevel, setEditLevel] = useState<RiskLevel | null>(null);
  const [editRationale, setEditRationale] = useState('');
  const [editImpactScope, setEditImpactScope] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [rationaleError, setRationaleError] = useState(false);

  // File management
  const [fileUploading, setFileUploading] = useState(false);
  const [editFiles, setEditFiles] = useState<GovernanceFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Checklist from policy
  const [checklistCategories, setChecklistCategories] = useState<ChecklistCategoryLocal[]>(FALLBACK_CATEGORIES);
  const [policyGradeLevels, setPolicyGradeLevels] = useState<PolicyGradeLevel[]>(FALLBACK_GRADE_LEVELS);
  const [showChecklist, setShowChecklist] = useState(false);
  const [checklistScores, setChecklistScores] = useState<Record<string, number>>({});
  const [checklistMitigations, setChecklistMitigations] = useState<Record<string, number>>(() => {
    const defaults: Record<string, number> = {};
    FALLBACK_CATEGORIES.forEach((cat: ChecklistCategoryLocal) =>
      cat.items.forEach((item: ChecklistItemLocal) => { defaults[item.id] = item.riskMitigation; })
    );
    return defaults;
  });

  /* ── Data loading ──────────────────── */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAgentflowRiskAssessments();
      setRecords(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      console.error('Failed to load risk workflows:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRiskPolicyForChecklist = useCallback(async () => {
    try {
      const policy = await getActiveRiskPolicy();
      if (policy) {
        const cats = policyToChecklistCategories(policy);
        setChecklistCategories(cats);
        const grades = policyToGradeLevels(policy);
        if (grades.length > 0) {
          setPolicyGradeLevels(grades);
        }
        const defaults: Record<string, number> = {};
        cats.forEach((cat: ChecklistCategoryLocal) =>
          cat.items.forEach((item: ChecklistItemLocal) => { defaults[item.id] = item.riskMitigation; })
        );
        setChecklistMitigations(defaults);
      }
    } catch (error: unknown) {
      console.error('Failed to load risk policy for checklist:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadRiskPolicyForChecklist();
  }, [loadData, loadRiskPolicyForChecklist]);

  /* ── Display helpers ──────────────── */
  const getDisplayLevel = useCallback((level: RiskLevel | null | undefined): RiskLevel => level || 'medium', []);

  const getLevelLabel = useCallback((level: RiskLevel | null | undefined): string => {
    if (level === null || level === undefined) return t('admin.governance.riskManagement.levelNone');
    const config = RISK_LEVEL_CONFIG[level];
    return config ? t(config.labelKey) : t('admin.governance.riskManagement.levelNone');
  }, [t]);

  const getLevelColor = useCallback((level: RiskLevel | null | undefined): string => {
    const displayLevel: RiskLevel = getDisplayLevel(level);
    return RISK_LEVEL_CONFIG[displayLevel]?.color || '#94a3b8';
  }, [getDisplayLevel]);

  const getLevelBg = useCallback((level: RiskLevel | null | undefined): string => {
    const displayLevel: RiskLevel = getDisplayLevel(level);
    return RISK_LEVEL_CONFIG[displayLevel]?.bg || '#f1f5f9';
  }, [getDisplayLevel]);

  /* ── Filter + search + sort ──────── */
  const filteredRecords = useMemo(() => {
    let result = [...records];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r: RiskAssessment) =>
        r.workflow_name.toLowerCase().includes(q) ||
        (r.owner_name || '').toLowerCase().includes(q) ||
        (r.owner_department || '').toLowerCase().includes(q)
      );
    }
    if (filterLevel !== 'all') {
      result = result.filter((r: RiskAssessment) => getDisplayLevel(r.risk_level) === filterLevel);
    }
    result.sort((a: RiskAssessment, b: RiskAssessment) => {
      let cmp = 0;
      if (sortField === 'riskLevel') {
        const aLevel: RiskLevel = getDisplayLevel(a.risk_level);
        const bLevel: RiskLevel = getDisplayLevel(b.risk_level);
        cmp = RISK_ORDER[aLevel] - RISK_ORDER[bLevel];
      } else if (sortField === 'lastModified') {
        cmp = (a.updated_at || '').localeCompare(b.updated_at || '');
      } else {
        cmp = a.workflow_name.localeCompare(b.workflow_name);
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [records, searchQuery, filterLevel, sortField, sortDirection, getDisplayLevel]);

  /* ── Checklist score / suggested grade ── */
  const activeCategories = useMemo(() =>
    checklistCategories.filter((cat: ChecklistCategoryLocal) => (parseFloat(cat.weight) || 0) > 0),
  [checklistCategories]);

  const checklistMaxScore = useMemo(() =>
    activeCategories.reduce((sum: number, cat: ChecklistCategoryLocal) =>
      sum + cat.items.reduce((s: number, item: ChecklistItemLocal) => s + item.maxScore, 0), 0),
  [activeCategories]);

  const checklistScore = useMemo(() =>
    activeCategories.reduce((total: number, cat: ChecklistCategoryLocal) =>
      total + cat.items.reduce((sum: number, item: ChecklistItemLocal) => {
        const s = checklistScores[item.id] ?? 0;
        const m = checklistMitigations[item.id] ?? item.riskMitigation;
        return sum + Math.max(0, s - m);
      }, 0), 0),
  [activeCategories, checklistScores, checklistMitigations]);

  const checklistSuggestedGrade = useMemo(() =>
    findMatchingGrade(checklistScore, policyGradeLevels),
  [checklistScore, policyGradeLevels]);

  const checklistSuggestedLevel = useMemo(() =>
    gradeToRiskLevel(checklistSuggestedGrade, policyGradeLevels),
  [checklistSuggestedGrade, policyGradeLevels]);

  /* ── Stats ──────────────────────── */
  const stats = useMemo(() => {
    const counts: Record<RiskLevel, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    records.forEach((r: RiskAssessment) => {
      const level: RiskLevel = getDisplayLevel(r.risk_level);
      counts[level]++;
    });
    return counts;
  }, [records, getDisplayLevel]);

  /* ── Handlers ──────────────────── */
  const handleSort = useCallback((field: 'lastModified' | 'riskLevel' | 'workflowName') => {
    if (sortField === field) setSortDirection((d: 'asc' | 'desc') => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('desc'); }
  }, [sortField]);

  const handleRowClick = useCallback(async (record: RiskAssessment) => {
    setDetailLoading(true);
    setSelectedRecord(record);
    setDetailData(null);
    setDetailFiles([]);
    try {
      const detail = await getAgentflowRiskDetail(record.workflow_id);
      setDetailData(detail);
    } catch (error: unknown) {
      console.error('Failed to load workflow detail:', error);
    }
    try {
      const files = await getGovernanceFiles(record.workflow_id);
      setDetailFiles(Array.isArray(files) ? files : []);
    } catch {
      // files load failure is non-critical
    }
    setDetailLoading(false);
  }, []);

  const handleEditOpen = useCallback(async (record: RiskAssessment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditRecord(record);
    setEditLevel(record.risk_level);
    setEditRationale('');
    setEditImpactScope(record.impact_scope || '');
    setRationaleError(false);
    setEditFiles([]);

    try {
      const files = await getGovernanceFiles(record.workflow_id);
      setEditFiles(Array.isArray(files) ? files : []);
    } catch {
      // non-critical
    }
  }, []);

  const handleEditClose = useCallback(() => {
    setEditRecord(null);
    setEditLevel(null);
    setEditRationale('');
    setEditImpactScope('');
    setRationaleError(false);
    setEditFiles([]);
  }, []);

  const handleEditSubmit = useCallback(async () => {
    if (!editRecord) return;
    if (!editRationale.trim()) {
      setRationaleError(true);
      return;
    }
    setEditSubmitting(true);
    try {
      await updateRiskAssessment(editRecord.workflow_id, {
        risk_level: editLevel as RiskLevel,
        rationale: editRationale.trim(),
        impact_scope: editImpactScope.trim() || undefined,
      });
      handleEditClose();
      loadData();
    } catch (error: unknown) {
      console.error('Failed to update risk level:', error);
    } finally {
      setEditSubmitting(false);
    }
  }, [editRecord, editLevel, editRationale, editImpactScope, handleEditClose, loadData]);

  /* ── File handlers ──────────────── */
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || !editRecord) return;
    setFileUploading(true);
    try {
      for (const file of Array.from(files)) {
        const result = await uploadGovernanceFile(editRecord.workflow_id, file);
        if (result) {
          setEditFiles((prev: GovernanceFile[]) => [...prev, result]);
        }
      }
    } catch (error: unknown) {
      console.error('File upload failed:', error);
    } finally {
      setFileUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [editRecord]);

  const handleFileDownload = useCallback(async (file: GovernanceFile) => {
    try {
      await downloadGovernanceFile(file.id, file.name);
    } catch (error: unknown) {
      console.error('File download failed:', error);
    }
  }, []);

  const handleFileDelete = useCallback(async (fileId: string) => {
    try {
      await deleteGovernanceFile(fileId);
      setEditFiles((prev: GovernanceFile[]) => prev.filter((f: GovernanceFile) => f.id !== fileId));
      setDetailFiles((prev: GovernanceFile[]) => prev.filter((f: GovernanceFile) => f.id !== fileId));
    } catch (error: unknown) {
      console.error('File delete failed:', error);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  /* ── Checklist handlers ──────────── */
  const handleChecklistOpen = useCallback(() => setShowChecklist(true), []);
  const handleChecklistClose = useCallback(() => setShowChecklist(false), []);

  const handleChecklistScoreChange = useCallback((itemId: string, value: number) =>
    setChecklistScores((prev: Record<string, number>) => ({ ...prev, [itemId]: value })),
  []);

  const handleChecklistReset = useCallback(() => {
    setChecklistScores({});
    const defaults: Record<string, number> = {};
    checklistCategories.forEach((cat: ChecklistCategoryLocal) =>
      cat.items.forEach((item: ChecklistItemLocal) => { defaults[item.id] = item.riskMitigation; })
    );
    setChecklistMitigations(defaults);
  }, [checklistCategories]);

  const handleChecklistApply = useCallback(() => {
    setEditLevel(checklistSuggestedLevel);
    setShowChecklist(false);
  }, [checklistSuggestedLevel]);

  /* ── Risk history rendering ──────── */
  const renderHistory = useCallback((history: RiskChangeHistory[]) => {
    if (!history || history.length === 0) {
      return <div className="text-sm text-muted-foreground py-4 text-center">{t('admin.governance.riskManagement.noHistory')}</div>;
    }
    return (
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-muted/30 text-left">
            <th className="px-3 py-2 font-semibold text-xs text-muted-foreground tracking-wide text-xs">{t('admin.governance.riskManagement.historyDate')}</th>
            <th className="px-3 py-2 font-semibold text-xs text-muted-foreground tracking-wide text-xs">{t('admin.governance.riskManagement.riskLevel')}</th>
            <th className="px-3 py-2 font-semibold text-xs text-muted-foreground tracking-wide text-xs">{t('admin.governance.riskManagement.historyModifier')}</th>
            <th className="px-3 py-2 font-semibold text-xs text-muted-foreground tracking-wide text-xs">{t('admin.governance.riskManagement.historyRationale')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {[...history].reverse().map((entry: RiskChangeHistory, idx: number) => (
            <tr key={idx}>
              <td className="px-3 py-2 text-xs text-muted-foreground">
                {new Date(entry.changed_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ color: getLevelColor(entry.previous_level), backgroundColor: getLevelBg(entry.previous_level) }}>
                    {getLevelLabel(entry.previous_level)}
                  </span>
                  <span className="text-muted-foreground">&rarr;</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ color: getLevelColor(entry.new_level), backgroundColor: getLevelBg(entry.new_level) }}>
                    {getLevelLabel(entry.new_level)}
                  </span>
                </div>
              </td>
              <td className="px-3 py-2 text-xs">{entry.changed_by}</td>
              <td className="px-3 py-2 text-xs">{entry.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }, [t, getLevelColor, getLevelBg, getLevelLabel]);

  /* ── Render ──────────────────────── */
  return (
    <ContentArea
      title={t('admin.pages.govRiskManagement.title')}
      description={t('admin.pages.govRiskManagement.description')}
      headerActions={
        <Button variant="outline" size="sm" onClick={() => loadData()} disabled={loading}>
          {t('admin.governance.common.refresh', 'Refresh')}
        </Button>
      }
      toolbar={
        <div className="flex items-center gap-3 w-full">
          <SearchInput
            value={searchQuery}
            onChange={(val: string) => setSearchQuery(val)}
            placeholder={t('admin.governance.riskManagement.searchPlaceholder')}
          />
          <div className="ml-auto">
            <select
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-card text-foreground"
              value={filterLevel}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterLevel(e.target.value as RiskLevel | 'all')}
            >
              <option value="all">{t('admin.governance.common.allLevels')}</option>
              {(Object.keys(RISK_LEVEL_CONFIG) as RiskLevel[]).map((lv: RiskLevel) => (
                <option key={lv} value={lv}>{t(RISK_LEVEL_CONFIG[lv].labelKey)}</option>
              ))}
            </select>
          </div>
        </div>
      }
      subToolbar={
        <div className="grid grid-cols-5 gap-4">
          <StatCard
            label={t('admin.governance.common.total')}
            value={loading ? '—' : records.length}
            variant="info"
            selected={filterLevel === 'all'}
            onClick={() => setFilterLevel('all')}
          />
          {(Object.keys(RISK_LEVEL_CONFIG) as RiskLevel[]).map((level: RiskLevel) => (
            <StatCard
              key={level}
              label={t(RISK_LEVEL_CONFIG[level].labelKey)}
              value={loading ? '—' : stats[level]}
              accentColor={RISK_LEVEL_CONFIG[level].color}
              subtitle={`/ ${records.length} ${t('admin.governance.riskManagement.totalCount')}`}
              selected={filterLevel === level}
              onClick={() => setFilterLevel(level)}
            />
          ))}
        </div>
      }
    >

        {/* Table */}
        {loading && records.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 text-left">
                  <th className="px-4 py-3 font-semibold text-xs text-muted-foreground tracking-wide cursor-pointer select-none" onClick={() => handleSort('workflowName')}>
                    {t('admin.governance.common.agentflow')}
                    {sortField === 'workflowName' && <span className="ml-1">{sortDirection === 'asc' ? '▲' : '▼'}</span>}
                  </th>
                  <th className="px-4 py-3 font-semibold text-xs text-muted-foreground tracking-wide">{t('admin.governance.common.creator')}</th>
                  <th className="px-4 py-3 font-semibold text-xs text-muted-foreground tracking-wide">{t('admin.governance.common.department')}</th>
                  <th className="px-4 py-3 font-semibold text-xs text-muted-foreground tracking-wide cursor-pointer select-none" onClick={() => handleSort('lastModified')}>
                    {t('admin.governance.common.lastModified')}
                    {sortField === 'lastModified' && <span className="ml-1">{sortDirection === 'asc' ? '▲' : '▼'}</span>}
                  </th>
                  <th className="px-4 py-3 font-semibold text-xs text-muted-foreground tracking-wide cursor-pointer select-none" onClick={() => handleSort('riskLevel')}>
                    {t('admin.governance.riskManagement.riskLevel')}
                    {sortField === 'riskLevel' && <span className="ml-1">{sortDirection === 'asc' ? '▲' : '▼'}</span>}
                  </th>
                  <th className="px-4 py-3 font-semibold text-xs text-muted-foreground tracking-wide">{t('admin.governance.riskManagement.impactScope')}</th>
                  <th className="px-4 py-3 font-semibold text-xs text-muted-foreground tracking-wide">{t('admin.governance.common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRecords.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">{t('admin.governance.common.noData')}</td></tr>
                ) : (
                  filteredRecords.map((record: RiskAssessment) => (
                    <tr key={record.workflow_id} onClick={() => handleRowClick(record)} className="hover:bg-muted/30 cursor-pointer transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground">{record.workflow_name}</span>
                        <span className="block text-xs text-muted-foreground mt-0.5">{record.workflow_id}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{record.owner_name || '-'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{record.owner_department || '-'}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(record.updated_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        {record.risk_level ? (
                          <span className="px-2 py-0.5 text-xs rounded" style={{
                            color: getLevelColor(record.risk_level),
                            backgroundColor: getLevelBg(record.risk_level),
                          }}>
                            {getLevelLabel(record.risk_level)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">{t('admin.governance.riskManagement.levelNone')}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{record.impact_scope || '-'}</td>
                      <td className="px-4 py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e: React.MouseEvent) => handleEditOpen(record, e)}
                        >
                          {t('admin.governance.riskManagement.editRiskLevel')}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Detail modal ────────── */}
        {selectedRecord && (
          <Modal isOpen onClose={() => setSelectedRecord(null)} title={selectedRecord.workflow_name}>
            <div className="flex flex-col gap-5 p-4 max-h-[70vh] overflow-y-auto">
              {/* Basic info grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Agentflow ID</p>
                  <p className="text-sm font-medium text-foreground">{selectedRecord.workflow_id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('admin.governance.riskManagement.riskLevel')}</p>
                  {selectedRecord.risk_level ? (
                    <span className="px-2 py-0.5 text-xs rounded" style={{
                      color: getLevelColor(selectedRecord.risk_level),
                      backgroundColor: getLevelBg(selectedRecord.risk_level),
                    }}>
                      {getLevelLabel(selectedRecord.risk_level)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">{t('admin.governance.riskManagement.levelNone')}</span>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('admin.governance.common.creator')}</p>
                  <p className="text-sm text-foreground">{selectedRecord.owner_name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('admin.governance.common.department')}</p>
                  <p className="text-sm text-foreground">{selectedRecord.owner_department || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('admin.governance.riskManagement.impactScope')}</p>
                  <p className="text-sm text-foreground">{selectedRecord.impact_scope || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('admin.governance.common.lastModified')}</p>
                  <p className="text-sm text-foreground">
                    {new Date(selectedRecord.updated_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Rationale */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">{t('admin.governance.riskManagement.rationale')}</h3>
                {selectedRecord.rationale ? (
                  <p className="text-sm text-foreground bg-muted/30 rounded-lg p-3">{selectedRecord.rationale}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('admin.governance.riskManagement.noHistory')}</p>
                )}
              </div>

              {/* Governance files (download only in detail modal) */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">{t('admin.governance.common.attachments')}</h3>
                {detailFiles.length > 0 ? (
                  <div className="space-y-2">
                    {detailFiles.map((file: GovernanceFile) => (
                      <div key={file.id} className="flex items-center justify-between p-2 rounded-lg border border-border">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-foreground">{file.name}</span>
                          <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                          <span className="text-xs text-muted-foreground">{file.uploaded_by}</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleFileDownload(file)}>
                          {t('admin.governance.riskManagement.fileDownload')}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('admin.governance.riskManagement.noFiles')}</p>
                )}
              </div>

              {/* Risk history */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">{t('admin.governance.riskManagement.riskHistory')}</h3>
                {detailLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </div>
                ) : (
                  renderHistory(detailData?.risk_history || [])
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="primary" onClick={() => { const rec = selectedRecord; setSelectedRecord(null); handleEditOpen(rec); }}>
                  {t('admin.governance.riskManagement.editRiskLevel')}
                </Button>
                <Button variant="outline" onClick={() => setSelectedRecord(null)}>
                  {t('admin.governance.riskManagement.closeDetail')}
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* ── Edit risk level modal ──── */}
        {editRecord && (
          <Modal isOpen onClose={handleEditClose} title={`${t('admin.governance.riskManagement.editRiskLevel')}: ${editRecord.workflow_name}`}>
            <div className="flex flex-col gap-5 p-4 max-h-[70vh] overflow-y-auto">
              {/* Current → New level display */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">{t('admin.governance.riskManagement.currentLevel')}</p>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs rounded" style={{
                    color: getLevelColor(editRecord.risk_level),
                    backgroundColor: getLevelBg(editRecord.risk_level),
                  }}>
                    {getLevelLabel(editRecord.risk_level)}
                  </span>
                  <span className="text-muted-foreground">&rarr;</span>
                  <span className="px-2 py-0.5 text-xs rounded" style={{
                    color: getLevelColor(editLevel),
                    backgroundColor: getLevelBg(editLevel),
                  }}>
                    {getLevelLabel(editLevel)}
                  </span>
                </div>
              </div>

              {/* Level selection */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  {t('admin.governance.riskManagement.newLevel')} <span className="text-red-500">*</span>
                </p>
                <div className="flex gap-2 flex-wrap">
                  {(Object.keys(RISK_LEVEL_CONFIG) as RiskLevel[]).map((level: RiskLevel) => (
                    <button
                      key={level}
                      type="button"
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${editLevel === level ? 'ring-2 ring-offset-1' : 'hover:border-primary/50'}`}
                      style={{
                        color: RISK_LEVEL_CONFIG[level].color,
                        borderColor: editLevel === level ? RISK_LEVEL_CONFIG[level].color : undefined,
                        backgroundColor: editLevel === level ? RISK_LEVEL_CONFIG[level].bg : undefined,
                      }}
                      onClick={() => setEditLevel(level)}
                    >
                      {t(RISK_LEVEL_CONFIG[level].labelKey)}
                    </button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleChecklistOpen}
                  >
                    Checklist
                  </Button>
                </div>
              </div>

              {/* Impact scope */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">{t('admin.governance.riskManagement.impactScope')}</p>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={editImpactScope}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditImpactScope(e.target.value)}
                  placeholder={t('admin.governance.riskManagement.impactScopePlaceholder')}
                />
              </div>

              {/* Rationale (required) */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  {t('admin.governance.riskManagement.changeRationale')} <span className="text-red-500">*</span>
                </p>
                <textarea
                  className={`w-full px-3 py-2 text-sm rounded-lg border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary ${rationaleError ? 'border-red-500' : 'border-border'}`}
                  value={editRationale}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => { setEditRationale(e.target.value); setRationaleError(false); }}
                  placeholder={t('admin.governance.riskManagement.rationalePlaceholder')}
                  rows={4}
                />
                {rationaleError && (
                  <p className="text-xs text-red-500 mt-1">{t('admin.governance.riskManagement.rationaleRequired')}</p>
                )}
              </div>

              {/* File attachments */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">{t('admin.governance.common.attachments')}</p>
                {/* Upload area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && fileInputRef.current?.click()}
                >
                  {fileUploading ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      {t('admin.governance.riskManagement.fileUploading')}
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">{t('admin.governance.common.fileUploadHint')}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t('admin.governance.riskManagement.fileMaxSize')}</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileUpload(e.target.files)}
                />
                {/* Uploaded file list */}
                {editFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {editFiles.map((file: GovernanceFile) => (
                      <div key={file.id} className="flex items-center justify-between p-2 rounded-lg border border-border">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-foreground">{file.name}</span>
                          <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleFileDelete(file.id)}>
                          {t('admin.governance.common.delete')}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="outline" onClick={handleEditClose}>
                  {t('admin.governance.common.cancel')}
                </Button>
                <Button variant="primary" onClick={handleEditSubmit} disabled={editSubmitting}>
                  {t('admin.governance.common.save')}
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* ── Checklist modal ──────── */}
        {showChecklist && (
          <Modal isOpen onClose={handleChecklistClose} title="AI 서비스 위험 평가 체크리스트">
            <div className="flex flex-col gap-4 p-4 max-h-[70vh] overflow-y-auto">
              <p className="text-sm text-muted-foreground">
                각 항목에 위험 점수(0 ~ 배점)를 입력하세요. 위험경감 점수를 차감한 잔여 위험의 합산으로 위험등급이 자동 산정됩니다.
              </p>

              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 text-left">
                      <th className="px-3 py-2 font-semibold text-xs text-muted-foreground tracking-wide text-xs">부문</th>
                      <th className="px-3 py-2 font-semibold text-xs text-muted-foreground tracking-wide text-xs">위험 인식/측정</th>
                      <th className="px-3 py-2 font-semibold text-xs text-muted-foreground tracking-wide text-xs text-center">배점</th>
                      <th className="px-3 py-2 font-semibold text-xs text-muted-foreground tracking-wide text-xs text-center">위험 점수</th>
                      <th className="px-3 py-2 font-semibold text-xs text-muted-foreground tracking-wide text-xs text-center">위험경감</th>
                      <th className="px-3 py-2 font-semibold text-xs text-muted-foreground tracking-wide text-xs text-center">잔여위험</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {checklistCategories.map((cat: ChecklistCategoryLocal) =>
                      cat.items.map((item: ChecklistItemLocal, itemIdx: number) => {
                        const score = checklistScores[item.id] ?? 0;
                        const mitigation = checklistMitigations[item.id] ?? item.riskMitigation;
                        const residual = Math.max(0, score - mitigation);
                        return (
                          <tr key={item.id}>
                            {itemIdx === 0 && (
                              <td rowSpan={cat.items.length} className="px-3 py-2 text-xs font-medium align-top border-r border-border">
                                <span>{cat.name}</span>
                                <span className="block text-muted-foreground">({cat.weight})</span>
                              </td>
                            )}
                            <td className="px-3 py-2 text-xs">{item.name}</td>
                            <td className="px-3 py-2 text-xs text-center">{item.maxScore}</td>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={score}
                                onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.select()}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  const raw = e.target.value.replace(/[^0-9]/g, '');
                                  const v = raw === '' ? 0 : Math.min(item.maxScore, Math.max(0, Number(raw)));
                                  handleChecklistScoreChange(item.id, v);
                                }}
                                className="w-12 px-1 py-0.5 text-xs text-center rounded border border-border bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </td>
                            <td className="px-3 py-2 text-xs text-center">{mitigation}</td>
                            <td className="px-3 py-2 text-xs text-center font-medium">{residual}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Score summary */}
              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">총 위험 점수</span>
                  <span className="text-sm">
                    <strong>{checklistScore}</strong> / {checklistMaxScore}점
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${checklistMaxScore > 0 ? (checklistScore / checklistMaxScore) * 100 : 0}%`,
                      backgroundColor: checklistSuggestedGrade?.color || '#94a3b8',
                    }}
                  />
                </div>
                <div className="relative h-5 mt-1">
                  {checklistMaxScore > 0 && policyGradeLevels
                    .filter((g: PolicyGradeLevel) => g.min_score != null)
                    .sort((a: PolicyGradeLevel, b: PolicyGradeLevel) => (a.min_score ?? 0) - (b.min_score ?? 0))
                    .map((g: PolicyGradeLevel) => (
                      <span
                        key={g.id}
                        className="absolute text-[10px] text-muted-foreground"
                        style={{ left: `${((g.min_score ?? 0) / checklistMaxScore) * 100}%` }}
                      >
                        {g.min_score}
                      </span>
                    ))
                  }
                  <span className="absolute right-0 text-[10px] text-muted-foreground">{checklistMaxScore}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">추천 위험등급</span>
                  <span
                    className="px-2 py-0.5 text-xs rounded border"
                    style={{
                      color: checklistSuggestedGrade?.color || '#94a3b8',
                      backgroundColor: checklistSuggestedGrade ? `${checklistSuggestedGrade.color}14` : '#f1f5f9',
                      borderColor: checklistSuggestedGrade?.color || '#94a3b8',
                    }}
                  >
                    {checklistSuggestedGrade?.name || '없음'}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="outline" onClick={handleChecklistReset}>초기화</Button>
                <Button variant="outline" onClick={handleChecklistClose}>취소</Button>
                <Button variant="primary" onClick={handleChecklistApply}>등급 적용</Button>
              </div>
            </div>
          </Modal>
        )}
    </ContentArea>
  );
};

/* ------------------------------------------------------------------ */
/*  Feature module export                                              */
/* ------------------------------------------------------------------ */
const feature: AdminFeatureModule = {
  id: 'admin-gov-risk-management',
  name: 'AdminGovRiskManagementPage',
  adminSection: 'admin-governance',
  sidebarItems: [
    { id: 'admin-gov-risk-management', titleKey: 'admin.sidebar.governance.riskReview.title', descriptionKey: 'admin.sidebar.governance.riskReview.description' },
  ],
  routes: {
    'admin-gov-risk-management': AdminGovRiskManagementPage,
  },
};

export default feature;
