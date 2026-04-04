'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea, Button, SearchInput, Modal, StatCard } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import {
  getPIIsList,
  createPII,
  updatePII,
  deletePII,
  getForbiddenWordsList,
  createForbiddenWord,
  updateForbiddenWord,
  deleteForbiddenWord,
  getActiveRiskPolicy,
  getRiskPolicyVersions,
  saveRiskPolicy,
  clearRiskPolicyHistory,
  type PolicyRule,
  type RiskPolicy,
  type RiskPolicyCategory,
  type RiskPolicyVersion,
  type RiskLevel,
} from '@xgen/api-client';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RegexTemplate {
  id: string;
  name: string;
  description: string;
  pattern: string;
  category: string;
}

interface RegexBlock {
  id: string;
  name: string;
  pattern: string;
  description: string;
}

interface RiskItem {
  id: string;
  name: string;
  max_score: number;
  risk_mitigation: number;
}

interface RiskCategoryLocal {
  id: string;
  name: string;
  weight: number;
  color: string;
  items: RiskItem[];
}

interface GradeLevel {
  id: string;
  name: string;
  min_score: number;
  max_score: number | null;
  color: string;
  management_policy: string;
}

interface RiskPolicyData {
  categories: RiskCategoryLocal[];
  grade_levels: GradeLevel[];
}

type PolicyTab = 'pii' | 'forbidden_words' | 'risk_level';

/* ------------------------------------------------------------------ */
/*  Form data — maps to the original's PolicyItem shape for the form  */
/* ------------------------------------------------------------------ */
interface FormData {
  id?: string;
  name: string;
  description: string;
  pattern: string;
  enabled: boolean;
  masking: boolean;
  masking_pattern: string;
  is_default: boolean;
}

const EMPTY_FORM: FormData = {
  name: '',
  description: '',
  pattern: '',
  enabled: true,
  masking: true,
  masking_pattern: '****',
  is_default: false,
};

const CATEGORY_COLORS = ['#3b82f6', '#16a34a', '#d97706', '#dc2626', '#8b5cf6', '#ec4899'];

const genId = (): string => `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
const AdminGovControlPolicyPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();

  // Active tab
  const [activeTab, setActiveTab] = useState<PolicyTab>('pii');

  // Regex templates (Korean-specific)
  const REGEX_TEMPLATES: RegexTemplate[] = useMemo(() => [
    { id: 'kr_rrn', name: t('admin.settings.guarder.regexTemplates.krRrn'), description: t('admin.settings.guarder.regexTemplates.krRrnDesc'), pattern: '\\d{6}-[1-4]\\d{6}', category: t('admin.settings.guarder.regexTemplates.categoryKorea') },
    { id: 'kr_phone', name: t('admin.settings.guarder.regexTemplates.krPhone'), description: t('admin.settings.guarder.regexTemplates.krPhoneDesc'), pattern: '01[016789]-?\\d{3,4}-?\\d{4}', category: t('admin.settings.guarder.regexTemplates.categoryKorea') },
    { id: 'kr_tel', name: t('admin.settings.guarder.regexTemplates.krTel'), description: t('admin.settings.guarder.regexTemplates.krTelDesc'), pattern: '0\\d{1,2}-?\\d{3,4}-?\\d{4}', category: t('admin.settings.guarder.regexTemplates.categoryKorea') },
    { id: 'kr_card', name: t('admin.settings.guarder.regexTemplates.krCard'), description: t('admin.settings.guarder.regexTemplates.krCardDesc'), pattern: '\\d{4}-?\\d{4}-?\\d{4}-?\\d{4}', category: t('admin.settings.guarder.regexTemplates.categoryKorea') },
    { id: 'kr_passport', name: t('admin.settings.guarder.regexTemplates.krPassport'), description: t('admin.settings.guarder.regexTemplates.krPassportDesc'), pattern: '[A-Z]{1,2}\\d{7,8}', category: t('admin.settings.guarder.regexTemplates.categoryKorea') },
    { id: 'kr_driver', name: t('admin.settings.guarder.regexTemplates.krDriver'), description: t('admin.settings.guarder.regexTemplates.krDriverDesc'), pattern: '\\d{2}-\\d{2}-\\d{6}-\\d{2}', category: t('admin.settings.guarder.regexTemplates.categoryKorea') },
    { id: 'kr_business', name: t('admin.settings.guarder.regexTemplates.krBusiness'), description: t('admin.settings.guarder.regexTemplates.krBusinessDesc'), pattern: '\\d{3}-\\d{2}-\\d{5}', category: t('admin.settings.guarder.regexTemplates.categoryKorea') },
    { id: 'email', name: t('admin.settings.guarder.regexTemplates.email'), description: t('admin.settings.guarder.regexTemplates.emailDesc'), pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', category: t('admin.settings.guarder.regexTemplates.categoryCommon') },
    { id: 'ipv4', name: t('admin.settings.guarder.regexTemplates.ipv4'), description: t('admin.settings.guarder.regexTemplates.ipv4Desc'), pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', category: t('admin.settings.guarder.regexTemplates.categoryCommon') },
    { id: 'url', name: t('admin.settings.guarder.regexTemplates.url'), description: t('admin.settings.guarder.regexTemplates.urlDesc'), pattern: "https?://[\\w\\-._~:/?#[\\]@!$&'()*+,;=%]+", category: t('admin.settings.guarder.regexTemplates.categoryCommon') },
    { id: 'date_ymd', name: t('admin.settings.guarder.regexTemplates.dateYmd'), description: t('admin.settings.guarder.regexTemplates.dateYmdDesc'), pattern: '\\d{4}[-/.]\\d{2}[-/.]\\d{2}', category: t('admin.settings.guarder.regexTemplates.categoryCommon') },
    { id: 'date_korean', name: t('admin.settings.guarder.regexTemplates.dateKorean'), description: t('admin.settings.guarder.regexTemplates.dateKoreanDesc'), pattern: '\\d{4}\ub144\\s*\\d{1,2}\uc6d4\\s*\\d{1,2}\uc77c', category: t('admin.settings.guarder.regexTemplates.categoryCommon') },
    { id: 'us_ssn', name: t('admin.settings.guarder.regexTemplates.usSsn'), description: t('admin.settings.guarder.regexTemplates.usSsnDesc'), pattern: '\\d{3}-\\d{2}-\\d{4}', category: t('admin.settings.guarder.regexTemplates.categoryInternational') },
    { id: 'uk_nino', name: t('admin.settings.guarder.regexTemplates.ukNino'), description: t('admin.settings.guarder.regexTemplates.ukNinoDesc'), pattern: '[A-Z]{2}\\d{6}[A-Z]', category: t('admin.settings.guarder.regexTemplates.categoryInternational') },
  ], [t]);

  // Regex blocks
  const REGEX_BLOCKS: RegexBlock[] = useMemo(() => [
    { id: 'digit', name: t('admin.settings.guarder.regexBlocks.digit'), pattern: '\\d', description: t('admin.settings.guarder.regexBlocks.digitDesc') },
    { id: 'digits', name: t('admin.settings.guarder.regexBlocks.digits'), pattern: '\\d+', description: t('admin.settings.guarder.regexBlocks.digitsDesc') },
    { id: 'letter', name: t('admin.settings.guarder.regexBlocks.letter'), pattern: '[a-zA-Z]', description: t('admin.settings.guarder.regexBlocks.letterDesc') },
    { id: 'letters', name: t('admin.settings.guarder.regexBlocks.letters'), pattern: '[a-zA-Z]+', description: t('admin.settings.guarder.regexBlocks.lettersDesc') },
    { id: 'korean', name: t('admin.settings.guarder.regexBlocks.korean'), pattern: '[\uAC00-\uD7A3]', description: t('admin.settings.guarder.regexBlocks.koreanDesc') },
    { id: 'koreans', name: t('admin.settings.guarder.regexBlocks.koreans'), pattern: '[\uAC00-\uD7A3]+', description: t('admin.settings.guarder.regexBlocks.koreansDesc') },
    { id: 'word', name: t('admin.settings.guarder.regexBlocks.word'), pattern: '\\w+', description: t('admin.settings.guarder.regexBlocks.wordDesc') },
    { id: 'space', name: t('admin.settings.guarder.regexBlocks.space'), pattern: '\\s', description: t('admin.settings.guarder.regexBlocks.spaceDesc') },
    { id: 'any', name: t('admin.settings.guarder.regexBlocks.any'), pattern: '.', description: t('admin.settings.guarder.regexBlocks.anyDesc') },
    { id: 'hyphen', name: t('admin.settings.guarder.regexBlocks.hyphen'), pattern: '-', description: t('admin.settings.guarder.regexBlocks.hyphenDesc') },
    { id: 'dot', name: t('admin.settings.guarder.regexBlocks.dot'), pattern: '\\.', description: t('admin.settings.guarder.regexBlocks.dotDesc') },
    { id: 'at', name: t('admin.settings.guarder.regexBlocks.at'), pattern: '@', description: t('admin.settings.guarder.regexBlocks.atDesc') },
    { id: 'optional', name: t('admin.settings.guarder.regexBlocks.optional'), pattern: '?', description: t('admin.settings.guarder.regexBlocks.optionalDesc') },
    { id: 'group_start', name: t('admin.settings.guarder.regexBlocks.groupStart'), pattern: '(', description: t('admin.settings.guarder.regexBlocks.groupStartDesc') },
    { id: 'group_end', name: t('admin.settings.guarder.regexBlocks.groupEnd'), pattern: ')', description: t('admin.settings.guarder.regexBlocks.groupEndDesc') },
    { id: 'or', name: t('admin.settings.guarder.regexBlocks.or'), pattern: '|', description: t('admin.settings.guarder.regexBlocks.orDesc') },
  ], [t]);

  // State - PII
  const [piisList, setPiisList] = useState<PolicyRule[]>([]);
  const [piisLoading, setPiisLoading] = useState(false);

  // State - Forbidden Words
  const [fwList, setFwList] = useState<PolicyRule[]>([]);
  const [fwLoading, setFwLoading] = useState(false);

  // Shared form state
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'name' | 'enabled'>('enabled');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [formData, setFormData] = useState<FormData>({ ...EMPTY_FORM });

  // Regex builder state
  const [showRegexBuilder, setShowRegexBuilder] = useState(false);
  const [regexTestText, setRegexTestText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Word pattern generator state
  const [wordInputText, setWordInputText] = useState('');
  const [wordMatchType, setWordMatchType] = useState<'contains' | 'exact' | 'startsWith' | 'endsWith'>('contains');

  // Risk Assessment state
  const [riskPolicy, setRiskPolicy] = useState<RiskPolicyData | null>(null);
  const [riskVersions, setRiskVersions] = useState<RiskPolicyVersion[]>([]);
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskDirty, setRiskDirty] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);

  // Delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  /* -- Helpers -- */
  const currentList = activeTab === 'pii' ? piisList : fwList;
  const currentLoading = activeTab === 'pii' ? piisLoading : fwLoading;
  const policyTypeLabel = activeTab === 'pii' ? t('admin.settings.guarder.piis.piiLabel') : t('admin.settings.guarder.piis.forbiddenWordLabel');

  /* -- Computed values -- */
  const regexTestResult = useMemo(() => {
    if (!formData.pattern || !regexTestText) {
      return { isValid: true, matches: [] as string[], error: null as string | null, maskedText: '', originalText: '' };
    }
    try {
      const regex = new RegExp(formData.pattern, 'g');
      const matches = regexTestText.match(regex) || [];
      let maskedText = regexTestText;
      if (formData.masking) {
        const maskStr = formData.masking_pattern || '****';
        maskedText = regexTestText.replace(regex, maskStr);
      } else {
        maskedText = regexTestText.replace(regex, '');
      }
      return { isValid: true, matches, error: null as string | null, maskedText, originalText: regexTestText };
    } catch (e: unknown) {
      return { isValid: false, matches: [] as string[], error: (e as Error).message, maskedText: '', originalText: regexTestText };
    }
  }, [formData.pattern, formData.masking, formData.masking_pattern, regexTestText]);

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === 'all') return REGEX_TEMPLATES;
    return REGEX_TEMPLATES.filter((tmpl: RegexTemplate) => tmpl.category === selectedCategory);
  }, [selectedCategory, REGEX_TEMPLATES]);

  const templateCategories = useMemo(() => {
    const cats = [...new Set(REGEX_TEMPLATES.map((tmpl: RegexTemplate) => tmpl.category))];
    return ['all', ...cats];
  }, [REGEX_TEMPLATES]);

  const filteredList = useMemo(() => {
    let result = [...currentList];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((item: PolicyRule) =>
        item.name.toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        item.pattern.toLowerCase().includes(q)
      );
    }
    result.sort((a: PolicyRule, b: PolicyRule) => {
      if (sortField === 'enabled') {
        if (a.enabled !== b.enabled) return sortDirection === 'desc' ? (a.enabled ? -1 : 1) : (a.enabled ? 1 : -1);
        return a.name.localeCompare(b.name);
      }
      const cmp = a.name.localeCompare(b.name);
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [currentList, searchQuery, sortField, sortDirection]);

  const piiStats = useMemo(() => {
    const active = piisList.filter((p: PolicyRule) => p.enabled).length;
    const inactive = piisList.filter((p: PolicyRule) => !p.enabled).length;
    return { active, inactive, total: piisList.length };
  }, [piisList]);

  const fwStats = useMemo(() => {
    const active = fwList.filter((p: PolicyRule) => p.enabled).length;
    const inactive = fwList.filter((p: PolicyRule) => !p.enabled).length;
    return { active, inactive, total: fwList.length };
  }, [fwList]);

  const combinedStats = useMemo(() => {
    const totalAll = piisList.length + fwList.length;
    const activeAll = piisList.filter((p: PolicyRule) => p.enabled).length + fwList.filter((p: PolicyRule) => p.enabled).length;
    return { totalAll, piiCount: piisList.length, fwCount: fwList.length, activeAll };
  }, [piisList, fwList]);

  const riskColors = ['#dc2626', '#ea580c', '#d97706', '#16a34a'];

  /* -- Data loading -- */
  const loadPIIsList = useCallback(async () => {
    setPiisLoading(true);
    try {
      const data = await getPIIsList();
      setPiisList(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      console.error('Failed to load PIIs list:', error);
    } finally {
      setPiisLoading(false);
    }
  }, []);

  const loadFWList = useCallback(async () => {
    setFwLoading(true);
    try {
      const data = await getForbiddenWordsList();
      setFwList(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      console.error('Failed to load Forbidden Words list:', error);
    } finally {
      setFwLoading(false);
    }
  }, []);

  /* -- Risk Assessment Data Loading -- */
  const loadRiskPolicy = useCallback(async () => {
    setRiskLoading(true);
    try {
      const policy = await getActiveRiskPolicy();
      if (policy && policy.categories) {
        // Map API RiskPolicyCategory to our local format
        const categories: RiskCategoryLocal[] = policy.categories.map((c: RiskPolicyCategory, idx: number) => ({
          id: genId(),
          name: c.name,
          weight: Number(c.weight) || 0,
          color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
          items: c.items.map((item: { id: string; label: string }) => ({
            id: item.id,
            name: item.label,
            max_score: 6,
            risk_mitigation: 2,
          })),
        }));
        // Map grade_config to grade_levels
        const gradeNames: Record<RiskLevel, string> = {
          critical: '\uCD5C\uACE0\uC704\uD5D8',
          high: '\uACE0\uC704\uD5D8',
          medium: '\uC911\uC704\uD5D8',
          low: '\uC800\uC704\uD5D8',
        };
        const gradeColors: Record<RiskLevel, string> = {
          critical: '#dc2626',
          high: '#ea580c',
          medium: '#d97706',
          low: '#16a34a',
        };
        const gradeLevels: GradeLevel[] = (['critical', 'high', 'medium', 'low'] as RiskLevel[]).map((level: RiskLevel) => ({
          id: genId(),
          name: gradeNames[level],
          min_score: policy.grade_config[level]?.min ?? 0,
          max_score: policy.grade_config[level]?.max ?? null,
          color: gradeColors[level],
          management_policy: '',
        }));
        setRiskPolicy({ categories, grade_levels: gradeLevels });
      }
    } catch (error: unknown) {
      console.error('Failed to load risk policy:', error);
    } finally {
      setRiskLoading(false);
    }
  }, []);

  const loadRiskVersions = useCallback(async () => {
    try {
      const versions = await getRiskPolicyVersions();
      setRiskVersions(versions || []);
    } catch (error: unknown) {
      console.error('Failed to load risk versions:', error);
    }
  }, []);

  useEffect(() => {
    loadPIIsList();
    loadFWList();
    loadRiskPolicy();
  }, [loadPIIsList, loadFWList, loadRiskPolicy]);

  /* -- Risk Assessment Handlers -- */
  const riskSummary = useMemo(() => {
    if (!riskPolicy) return { catCount: 0, itemCount: 0, weightSum: 0, gradeCount: 0 };
    const catCount = riskPolicy.categories.length;
    const itemCount = riskPolicy.categories.reduce((s: number, c: RiskCategoryLocal) => s + c.items.length, 0);
    const weightSum = riskPolicy.categories.reduce((s: number, c: RiskCategoryLocal) => s + c.weight, 0);
    const gradeCount = riskPolicy.grade_levels.length;
    return { catCount, itemCount, weightSum, gradeCount };
  }, [riskPolicy]);

  const handleRiskAddCategory = useCallback(() => {
    if (!riskPolicy) return;
    const colorIdx = riskPolicy.categories.length % CATEGORY_COLORS.length;
    const newCat: RiskCategoryLocal = {
      id: genId(), name: '\uc0c8 \uc6d0\uce59', weight: 0, color: CATEGORY_COLORS[colorIdx], items: [],
    };
    setRiskPolicy({ ...riskPolicy, categories: [...riskPolicy.categories, newCat] });
    setRiskDirty(true);
  }, [riskPolicy]);

  const handleRiskRemoveCategory = useCallback((catId: string) => {
    if (!riskPolicy) return;
    setRiskPolicy({ ...riskPolicy, categories: riskPolicy.categories.filter((c: RiskCategoryLocal) => c.id !== catId) });
    setRiskDirty(true);
  }, [riskPolicy]);

  const handleRiskUpdateCategory = useCallback((catId: string, field: string, value: string) => {
    if (!riskPolicy) return;
    setRiskPolicy({
      ...riskPolicy,
      categories: riskPolicy.categories.map((c: RiskCategoryLocal) =>
        c.id === catId ? { ...c, [field]: field === 'weight' ? Number(value) || 0 : value } : c
      ),
    });
    setRiskDirty(true);
  }, [riskPolicy]);

  const handleRiskAddItem = useCallback((catId: string) => {
    if (!riskPolicy) return;
    const newItem: RiskItem = { id: genId(), name: '\uc0c8 \ud56d\ubaa9', max_score: 6, risk_mitigation: 2 };
    setRiskPolicy({
      ...riskPolicy,
      categories: riskPolicy.categories.map((c: RiskCategoryLocal) =>
        c.id === catId ? { ...c, items: [...c.items, newItem] } : c
      ),
    });
    setRiskDirty(true);
  }, [riskPolicy]);

  const handleRiskRemoveItem = useCallback((catId: string, itemId: string) => {
    if (!riskPolicy) return;
    setRiskPolicy({
      ...riskPolicy,
      categories: riskPolicy.categories.map((c: RiskCategoryLocal) =>
        c.id === catId ? { ...c, items: c.items.filter((i: RiskItem) => i.id !== itemId) } : c
      ),
    });
    setRiskDirty(true);
  }, [riskPolicy]);

  const handleRiskUpdateItem = useCallback((catId: string, itemId: string, field: string, value: string) => {
    if (!riskPolicy) return;
    setRiskPolicy({
      ...riskPolicy,
      categories: riskPolicy.categories.map((c: RiskCategoryLocal) =>
        c.id === catId ? {
          ...c,
          items: c.items.map((i: RiskItem) =>
            i.id === itemId ? { ...i, [field]: (field === 'max_score' || field === 'risk_mitigation') ? Number(value) || 0 : value } : i
          ),
        } : c
      ),
    });
    setRiskDirty(true);
  }, [riskPolicy]);

  const handleRiskMoveItem = useCallback((catId: string, itemId: string, direction: 'up' | 'down') => {
    if (!riskPolicy) return;
    setRiskPolicy({
      ...riskPolicy,
      categories: riskPolicy.categories.map((c: RiskCategoryLocal) => {
        if (c.id !== catId) return c;
        const idx = c.items.findIndex((i: RiskItem) => i.id === itemId);
        if (idx < 0) return c;
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= c.items.length) return c;
        const newItems = [...c.items];
        [newItems[idx], newItems[swapIdx]] = [newItems[swapIdx], newItems[idx]];
        return { ...c, items: newItems };
      }),
    });
    setRiskDirty(true);
  }, [riskPolicy]);

  const handleRiskAddGrade = useCallback(() => {
    if (!riskPolicy) return;
    const newGrade: GradeLevel = {
      id: genId(), name: '\uc0c8 \ub4f1\uae09', min_score: 0, max_score: 0, color: '#6b7280', management_policy: '',
    };
    setRiskPolicy({ ...riskPolicy, grade_levels: [...riskPolicy.grade_levels, newGrade] });
    setRiskDirty(true);
  }, [riskPolicy]);

  const handleRiskRemoveGrade = useCallback((gradeId: string) => {
    if (!riskPolicy) return;
    setRiskPolicy({ ...riskPolicy, grade_levels: riskPolicy.grade_levels.filter((g: GradeLevel) => g.id !== gradeId) });
    setRiskDirty(true);
  }, [riskPolicy]);

  const handleRiskUpdateGrade = useCallback((gradeId: string, field: string, value: string) => {
    if (!riskPolicy) return;
    setRiskPolicy({
      ...riskPolicy,
      grade_levels: riskPolicy.grade_levels.map((g: GradeLevel) =>
        g.id === gradeId ? {
          ...g,
          [field]: (field === 'min_score' || field === 'max_score') ? (value === '' || value === null ? null : Number(value) || 0) : value,
        } : g
      ),
    });
    setRiskDirty(true);
  }, [riskPolicy]);

  const handleRiskReset = useCallback(() => {
    loadRiskPolicy();
    setRiskDirty(false);
  }, [loadRiskPolicy]);

  const handleRiskSave = useCallback(async () => {
    if (!riskPolicy) return;
    // Build grade_levels as Record<RiskLevel, { min, max }>
    const levelNames: RiskLevel[] = ['critical', 'high', 'medium', 'low'];
    const gradeConfig: Record<string, { min: number; max: number }> = {};
    riskPolicy.grade_levels.forEach((g: GradeLevel, idx: number) => {
      const levelKey = levelNames[idx] || `level_${idx}`;
      gradeConfig[levelKey] = { min: g.min_score, max: g.max_score ?? 0 };
    });

    // Build categories for API
    const apiCategories: RiskPolicyCategory[] = riskPolicy.categories.map((c: RiskCategoryLocal) => ({
      name: c.name,
      weight: String(c.weight),
      items: c.items.map((item: RiskItem) => ({ id: item.id, label: item.name })),
    }));

    try {
      await saveRiskPolicy({
        categories: apiCategories,
        grade_levels: gradeConfig as Record<RiskLevel, { min: number; max: number }>,
      });
      setRiskDirty(false);
      loadRiskPolicy();
      loadRiskVersions();
    } catch (error: unknown) {
      console.error('Failed to save risk policy:', error);
    }
  }, [riskPolicy, loadRiskPolicy, loadRiskVersions]);

  const handleRiskDownload = useCallback(async () => {
    if (!riskPolicy) return;
    try {
      const policy = await getActiveRiskPolicy();
      const blob = new Blob([JSON.stringify(policy, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `risk_policy_v${policy.version || 1}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: unknown) {
      console.error('Failed to download risk policy:', error);
    }
  }, [riskPolicy]);

  const handleHistoryToggle = useCallback(async () => {
    if (!showHistoryPanel) await loadRiskVersions();
    setShowHistoryPanel(!showHistoryPanel);
  }, [showHistoryPanel, loadRiskVersions]);

  const handleClearHistory = useCallback(async () => {
    try {
      await clearRiskPolicyHistory();
      loadRiskVersions();
    } catch (error: unknown) {
      console.error('Failed to clear history:', error);
    }
  }, [loadRiskVersions]);

  // Reset view when switching tabs
  const handleTabChange = useCallback((tab: PolicyTab) => {
    setActiveTab(tab);
    setViewMode('list');
    setSearchQuery('');
    setFormData({ ...EMPTY_FORM });
  }, []);

  /* -- Handlers -- */
  const handleSort = useCallback((field: typeof sortField) => {
    if (sortField === field) setSortDirection((d: 'asc' | 'desc') => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('desc'); }
  }, [sortField]);

  const handleCreateClick = useCallback(() => {
    setFormData({ ...EMPTY_FORM });
    setShowRegexBuilder(false);
    setRegexTestText('');
    setWordInputText('');
    setViewMode('create');
  }, []);

  const handleEditClick = useCallback((item: PolicyRule) => {
    setFormData({
      id: item.id,
      name: item.name,
      description: item.description || '',
      pattern: item.pattern,
      enabled: item.enabled,
      masking: !!item.masking,
      masking_pattern: item.masking || item.replacement || '****',
      is_default: false,
    });
    setShowRegexBuilder(false);
    setRegexTestText('');
    setWordInputText('');
    setViewMode('edit');
  }, []);

  const handleCancel = useCallback(() => { setViewMode('list'); }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      if (activeTab === 'pii') {
        await deletePII(id);
        loadPIIsList();
      } else {
        await deleteForbiddenWord(id);
        loadFWList();
      }
    } catch (error: unknown) {
      console.error('Failed to delete policy:', error);
    }
    setDeleteTarget(null);
  }, [activeTab, loadPIIsList, loadFWList]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const apiData = {
        name: formData.name,
        type: (activeTab === 'pii' ? 'pii' : 'forbidden-word') as PolicyRule['type'],
        pattern: formData.pattern,
        replacement: formData.masking ? formData.masking_pattern : undefined,
        description: formData.description || undefined,
        masking: formData.masking ? formData.masking_pattern : undefined,
        enabled: formData.enabled,
      };

      if (activeTab === 'pii') {
        if (viewMode === 'create') {
          await createPII(apiData);
        } else {
          await updatePII(formData.id!, apiData);
        }
        loadPIIsList();
      } else {
        if (viewMode === 'create') {
          await createForbiddenWord(apiData);
        } else {
          await updateForbiddenWord(formData.id!, apiData);
        }
        loadFWList();
      }
      setViewMode('list');
    } catch (error: unknown) {
      console.error('Failed to save policy:', error);
    }
  }, [activeTab, viewMode, formData, loadPIIsList, loadFWList]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev: FormData) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  }, []);

  const handleToggle = useCallback((field: 'enabled' | 'masking') => {
    setFormData((prev: FormData) => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const handleTemplateSelect = useCallback((template: RegexTemplate) => {
    setFormData((prev: FormData) => ({
      ...prev,
      pattern: template.pattern,
      name: prev.name || template.id,
      description: prev.description || template.description,
    }));
  }, []);

  const handleBlockAdd = useCallback((block: RegexBlock) => {
    setFormData((prev: FormData) => ({ ...prev, pattern: prev.pattern + block.pattern }));
  }, []);

  const handleCopyPattern = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(formData.pattern);
    } catch {
      // clipboard write failed silently
    }
  }, [formData.pattern]);

  const handleClearPattern = useCallback(() => {
    setFormData((prev: FormData) => ({ ...prev, pattern: '' }));
  }, []);

  const generateWordPattern = useCallback(() => {
    if (!wordInputText.trim()) return;
    const words = wordInputText.split(/[,\uFF0C]/).map((w: string) => w.trim()).filter((w: string) => w.length > 0);
    if (words.length === 0) return;

    const escapeRegex = (str: string): string => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedWords = words.map(escapeRegex);
    const wordGroup = escapedWords.length === 1 ? escapedWords[0] : `(${escapedWords.join('|')})`;
    const hasKorean = words.some((w: string) => /[\uAC00-\uD7A3]/.test(w));

    let pattern: string;
    switch (wordMatchType) {
      case 'exact':
        pattern = hasKorean ? `(?<![\uAC00-\uD7A3a-zA-Z0-9])${wordGroup}(?![\uAC00-\uD7A3a-zA-Z0-9])` : `\\b${wordGroup}\\b`;
        break;
      case 'startsWith':
        pattern = hasKorean ? `(?<![\uAC00-\uD7A3a-zA-Z0-9])${wordGroup}[\uAC00-\uD7A3a-zA-Z0-9]*` : `\\b${wordGroup}[\uAC00-\uD7A3a-zA-Z0-9_]*`;
        break;
      case 'endsWith':
        pattern = hasKorean ? `[\uAC00-\uD7A3a-zA-Z0-9]*${wordGroup}(?![\uAC00-\uD7A3a-zA-Z0-9])` : `[\uAC00-\uD7A3a-zA-Z0-9_]*${wordGroup}\\b`;
        break;
      case 'contains':
      default:
        pattern = wordGroup;
        break;
    }

    setFormData((prev: FormData) => ({
      ...prev,
      pattern,
      description: prev.description || `${t('admin.settings.guarder.piis.detectionWords')}: ${words.join(', ')}`,
    }));
  }, [wordInputText, wordMatchType, t]);

  const handleAppendWordPattern = useCallback(() => {
    if (!wordInputText.trim()) return;
    const words = wordInputText.split(/[,\uFF0C]/).map((w: string) => w.trim()).filter((w: string) => w.length > 0);
    if (words.length === 0) return;

    const escapeRegex = (str: string): string => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const newPart = words.map(escapeRegex).join('|');

    if (formData.pattern) {
      const cp = formData.pattern;
      const updatedPattern = (cp.startsWith('(') && cp.endsWith(')'))
        ? cp.slice(0, -1) + '|' + newPart + ')'
        : `(${cp}|${newPart})`;
      setFormData((prev: FormData) => ({ ...prev, pattern: updatedPattern }));
    } else {
      const escapedWords = words.map(escapeRegex);
      const pattern = escapedWords.length === 1 ? escapedWords[0] : `(${newPart})`;
      setFormData((prev: FormData) => ({ ...prev, pattern }));
    }
    setWordInputText('');
  }, [wordInputText, formData.pattern]);

  const handleReload = useCallback(() => {
    if (activeTab === 'pii') loadPIIsList();
    else loadFWList();
  }, [activeTab, loadPIIsList, loadFWList]);

  /* ================================================================ */
  /*  Render helpers                                                   */
  /* ================================================================ */

  /* -- Regex Builder -- */
  const renderRegexBuilder = () => (
    <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex items-center justify-between mb-3">
        <h5 className="text-sm font-semibold text-foreground">{t('admin.settings.guarder.piis.regexBuilder')}</h5>
        <button type="button" onClick={() => setShowRegexBuilder(false)} className="text-muted-foreground hover:text-foreground text-lg">{'\u2715'}</button>
      </div>

      {/* Template section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-foreground">{t('admin.settings.guarder.piis.piiTemplates')}</span>
          <div className="flex gap-1">
            {templateCategories.map((cat: string) => (
              <button key={cat} type="button" onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${selectedCategory === cat ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                {cat === 'all' ? t('admin.settings.guarder.piis.all') : cat}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {filteredTemplates.map((template: RegexTemplate) => (
            <button key={template.id} type="button" onClick={() => handleTemplateSelect(template)}
              className="text-left px-3 py-2 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors" title={template.pattern}>
              <span className="block text-xs font-medium text-foreground">{template.name}</span>
              <span className="block text-xs text-muted-foreground mt-0.5 truncate">{template.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Block section */}
      <div className="mb-4">
        <span className="text-xs font-medium text-foreground">{t('admin.settings.guarder.piis.addRegexBlock')}</span>
        <p className="text-xs text-muted-foreground mb-2">{t('admin.settings.guarder.piis.addRegexBlockDesc')}</p>
        <div className="flex flex-wrap gap-1.5">
          {REGEX_BLOCKS.map((block: RegexBlock) => (
            <button key={block.id} type="button" onClick={() => handleBlockAdd(block)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-border bg-card hover:border-primary/50 transition-colors" title={block.description}>
              <span className="text-foreground">{block.name}</span>
              <code className="text-primary/80 font-mono">{block.pattern}</code>
            </button>
          ))}
        </div>
      </div>

      {/* Word pattern generator */}
      <div>
        <span className="text-xs font-medium text-foreground">{t('admin.settings.guarder.piis.wordPatternGenerator')}</span>
        <p className="text-xs text-muted-foreground mb-2">{t('admin.settings.guarder.piis.wordPatternGeneratorDesc')}</p>
        <div className="space-y-2">
          <input type="text" value={wordInputText} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWordInputText(e.target.value)}
            placeholder={t('admin.settings.guarder.piis.wordInputPlaceholder')}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t('admin.settings.guarder.piis.matchType')}:</span>
            <div className="flex gap-1">
              {(['contains', 'exact', 'startsWith', 'endsWith'] as const).map((mt) => (
                <button key={mt} type="button" onClick={() => setWordMatchType(mt)}
                  className={`px-2 py-0.5 text-xs rounded border transition-colors ${wordMatchType === mt ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                  {t(`admin.settings.guarder.piis.match${mt.charAt(0).toUpperCase() + mt.slice(1)}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={generateWordPattern}
              className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              {t('admin.settings.guarder.piis.generateRegex')}
            </button>
            <button type="button" onClick={handleAppendWordPattern}
              className="px-3 py-1.5 text-xs rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors disabled:opacity-40"
              disabled={!formData.pattern}>
              {t('admin.settings.guarder.piis.addToPattern')}
            </button>
          </div>
          {wordInputText && (
            <div className="flex flex-wrap gap-1 mt-1">
              <span className="text-xs text-muted-foreground">{t('admin.settings.guarder.piis.enteredWords')}:</span>
              {wordInputText.split(/[,\uFF0C]/).map((word: string, idx: number) => {
                const trimmed = word.trim();
                if (!trimmed) return null;
                return <span key={idx} className="px-1.5 py-0.5 text-xs rounded bg-primary/10 text-primary">{trimmed}</span>;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  /* -- Regex Test -- */
  const renderRegexTest = () => (
    <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-foreground">{t('admin.settings.guarder.piis.regexTest')}</span>
        <span className="text-xs text-muted-foreground">
          {formData.masking ? `${t('admin.settings.guarder.piis.maskingApplied')} (${formData.masking_pattern || '****'})` : t('admin.settings.guarder.piis.detectedTextRemoved')}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-2">{t('admin.settings.guarder.piis.regexTestDesc')}</p>
      <textarea value={regexTestText} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRegexTestText(e.target.value)}
        placeholder={t('admin.settings.guarder.piis.testInputPlaceholder')}
        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono resize-y" rows={3} />
      <div className="mt-2">
        {!formData.pattern ? (
          <span className="text-xs text-muted-foreground">{t('admin.settings.guarder.piis.enterPatternToTest')}</span>
        ) : !regexTestResult.isValid ? (
          <div className="text-xs text-red-500 p-2 rounded bg-red-500/10 border border-red-500/20">
            {t('admin.settings.guarder.piis.invalidRegex')}: {regexTestResult.error}
          </div>
        ) : regexTestText ? (
          regexTestResult.matches.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs text-green-600 p-2 rounded bg-green-500/10 border border-green-500/20">
                <span className="font-medium">{t('admin.settings.guarder.piis.matchesFound', { count: regexTestResult.matches.length })}</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {regexTestResult.matches.slice(0, 5).map((match: string, idx: number) => (
                    <code key={idx} className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-700 font-mono">{match}</code>
                  ))}
                  {regexTestResult.matches.length > 5 && (
                    <span className="text-muted-foreground">{t('admin.settings.guarder.piis.moreMatches', { count: regexTestResult.matches.length - 5 })}</span>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex gap-2 items-start">
                  <span className="text-xs text-muted-foreground w-16 shrink-0">{t('admin.settings.guarder.piis.original')}:</span>
                  <div className="text-xs font-mono text-foreground break-all">{regexTestText}</div>
                </div>
                <div className="text-center text-muted-foreground text-xs">&darr;</div>
                <div className="flex gap-2 items-start">
                  <span className="text-xs text-primary w-16 shrink-0">
                    {formData.masking ? t('admin.settings.guarder.piis.maskingResult') : t('admin.settings.guarder.piis.removalResult')}:
                  </span>
                  <div className="text-xs font-mono text-primary break-all">
                    {regexTestResult.maskedText || <span className="text-muted-foreground">({t('admin.settings.guarder.piis.emptyText')})</span>}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-orange-500 p-2 rounded bg-orange-500/10 border border-orange-500/20">
              {t('admin.settings.guarder.piis.noMatches')}
            </div>
          )
        ) : (
          <span className="text-xs text-muted-foreground">{t('admin.settings.guarder.piis.enterTestText')}</span>
        )}
      </div>
    </div>
  );

  /* -- Form Render (PII / Forbidden Words) -- */
  const renderForm = () => (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground transition-colors" title={t('admin.settings.guarder.piis.goBack')}>
          {'\u2190'}
        </button>
        <h3 className="text-sm font-semibold text-foreground">
          {viewMode === 'create' ? `${policyTypeLabel} ${t('admin.settings.guarder.piis.createPolicy')}` : `${policyTypeLabel} ${t('admin.settings.guarder.piis.editPolicy')}`}
        </h3>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                {t('admin.settings.guarder.piis.policyName')} <span className="text-red-500">*</span>
              </label>
              <input type="text" name="name" value={formData.name}
                onChange={handleInputChange}
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                required readOnly={viewMode === 'edit'}
                placeholder={t('admin.settings.guarder.piis.policyNamePlaceholder')} />
              {viewMode === 'edit' && <span className="text-xs text-muted-foreground mt-0.5">{t('admin.settings.guarder.piis.policyNameReadOnly')}</span>}
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">{t('admin.settings.guarder.piis.descriptionLabel')}</label>
              <input type="text" name="description" value={formData.description}
                onChange={handleInputChange}
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder={t('admin.settings.guarder.piis.descriptionPlaceholder')} />
            </div>
          </div>

          {/* Regex pattern */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              {t('admin.settings.guarder.piis.regexPattern')} <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2 mt-1">
              <input type="text" name="pattern" value={formData.pattern}
                onChange={handleInputChange}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border bg-background text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary ${!regexTestResult.isValid ? 'border-red-500' : 'border-border'}`}
                required placeholder={t('admin.settings.guarder.piis.regexPatternPlaceholder')} />
              {formData.pattern && (
                <div className="flex gap-1">
                  <button type="button" onClick={handleCopyPattern}
                    className="px-2 py-1 text-xs rounded border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                    title={t('admin.settings.guarder.piis.copyPattern')}>{t('admin.settings.guarder.piis.copyPattern')}</button>
                  <button type="button" onClick={handleClearPattern}
                    className="px-2 py-1 text-xs rounded border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors"
                    title={t('admin.settings.guarder.piis.clearPattern')}>{'\u2715'}</button>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">{t('admin.settings.guarder.piis.regexPatternHint')}</span>
              <button type="button" onClick={() => setShowRegexBuilder(!showRegexBuilder)}
                className={`text-xs px-2 py-0.5 rounded border transition-colors ${showRegexBuilder ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                {t('admin.settings.guarder.piis.regexBuilder')}
              </button>
            </div>
            {!regexTestResult.isValid && (
              <div className="mt-1 text-xs text-red-500">
                {t('admin.settings.guarder.piis.invalidRegexSyntax')}: {regexTestResult.error}
              </div>
            )}
            {showRegexBuilder && renderRegexBuilder()}
          </div>

          {/* Masking & Status toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Masking section */}
            <div className="rounded-lg border border-border p-4">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('admin.settings.guarder.piis.maskingSettings')}</label>
              <div role="button" tabIndex={0} onClick={() => handleToggle('masking')}
                onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggle('masking'); } }}
                className="flex items-center gap-3 cursor-pointer select-none">
                <div className={`relative w-10 h-5 rounded-full transition-colors ${formData.masking ? 'bg-green-500' : 'bg-muted-foreground/30'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.masking ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <div>
                  <span className={`text-sm font-medium ${formData.masking ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {formData.masking ? t('admin.settings.guarder.piis.maskingEnabled') : t('admin.settings.guarder.piis.maskingDisabled')}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {formData.masking ? t('admin.settings.guarder.piis.maskingEnabledDesc') : t('admin.settings.guarder.piis.maskingDisabledDesc')}
                  </p>
                </div>
              </div>
              {formData.masking && (
                <div className="mt-3">
                  <label className="text-xs font-medium text-muted-foreground">{t('admin.settings.guarder.piis.maskingPatternLabel')}</label>
                  <input type="text" name="masking_pattern" value={formData.masking_pattern}
                    onChange={handleInputChange}
                    className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder={t('admin.settings.guarder.piis.maskingPatternPlaceholder')} />
                  <span className="text-xs text-muted-foreground">{t('admin.settings.guarder.piis.maskingPatternHint')}</span>
                </div>
              )}
            </div>

            {/* Policy status */}
            <div className="rounded-lg border border-border p-4">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('admin.settings.guarder.piis.policyStatus')}</label>
              <div role="button" tabIndex={0} onClick={() => handleToggle('enabled')}
                onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggle('enabled'); } }}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer select-none transition-colors ${formData.enabled ? 'border-green-500/30 bg-green-500/5' : 'border-border bg-muted/30'}`}>
                <div className={`relative w-10 h-5 rounded-full transition-colors ${formData.enabled ? 'bg-green-500' : 'bg-muted-foreground/30'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <div>
                  <span className={`text-sm font-medium ${formData.enabled ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {formData.enabled ? t('admin.settings.guarder.piis.policyActive') : t('admin.settings.guarder.piis.policyInactive')}
                  </span>
                  <p className="text-xs text-muted-foreground">{t('admin.settings.guarder.piis.policyActiveDesc')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Regex test */}
          {renderRegexTest()}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={handleCancel}>{t('admin.settings.guarder.piis.cancel')}</Button>
          <Button type="submit">{t('admin.settings.guarder.piis.save')}</Button>
        </div>
      </form>
    </div>
  );

  /* -- Policy List (PII / Forbidden Words) -- */
  const renderPolicyList = () => (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-72">
          <SearchInput value={searchQuery} onChange={setSearchQuery}
            placeholder={t('admin.settings.guarder.piis.searchPlaceholder')} />
        </div>
        <button onClick={handleReload} disabled={currentLoading}
          className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-40">
          <svg className={`w-4 h-4 ${currentLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <div className="flex-1" />
        <Button size="sm" onClick={handleCreateClick}>
          + {activeTab === 'pii' ? t('admin.settings.guarder.piis.createPii') : t('admin.settings.guarder.piis.createForbiddenWord')}
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground" onClick={() => handleSort('name')}>
                {t('admin.settings.guarder.piis.policyName')}
                {sortField === 'name' && <span className="ml-1">{sortDirection === 'asc' ? '\u2191' : '\u2193'}</span>}
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">{t('admin.settings.guarder.piis.descriptionLabel')}</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">{t('admin.settings.guarder.piis.regexPattern')}</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">{t('admin.settings.guarder.piis.maskingSettings')}</th>
              <th className="px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground" onClick={() => handleSort('enabled')}>
                {t('admin.governance.common.status')}
                {sortField === 'enabled' && <span className="ml-1">{sortDirection === 'asc' ? '\u2191' : '\u2193'}</span>}
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground w-32">{t('admin.governance.common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredList.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                {currentLoading ? t('admin.governance.common.noData') : (activeTab === 'pii' ? t('admin.settings.guarder.piis.noPatterns') : t('admin.settings.guarder.piis.noForbiddenWords'))}
              </td></tr>
            ) : (
              filteredList.map((item: PolicyRule) => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => handleEditClick(item)}>
                  <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-xs truncate">{item.description || '-'}</td>
                  <td className="px-4 py-3"><code className="text-xs font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded max-w-xs truncate block">{item.pattern}</code></td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full ${item.masking ? 'bg-blue-500/10 text-blue-600' : 'bg-muted text-muted-foreground'}`}>
                      {item.masking ? `${t('admin.settings.guarder.piis.maskingEnabled')} (${item.masking || '****'})` : t('admin.settings.guarder.piis.maskingDisabled')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full font-medium ${item.enabled ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                      {item.enabled ? t('admin.settings.guarder.piis.active') : t('admin.settings.guarder.piis.inactive')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <Button variant="outline" size="sm" onClick={() => handleEditClick(item)}>{t('admin.governance.common.edit')}</Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteTarget({ id: item.id, name: item.name })} className="text-red-500 hover:text-red-600">{t('admin.governance.common.delete')}</Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );

  /* -- Risk Level Tab -- */
  const renderRiskLevel = () => {
    if (riskLoading) {
      return <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
    }
    if (!riskPolicy) {
      return <div className="text-center text-muted-foreground py-12">{t('admin.settings.guarder.piis.noRiskPolicyData')}</div>;
    }

    return (
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button size="sm" onClick={handleRiskAddCategory}>+ {t('admin.settings.guarder.piis.addCategory')}</Button>
            <Button variant="outline" size="sm" onClick={handleRiskReset} disabled={!riskDirty}>{t('admin.settings.guarder.piis.reset')}</Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRiskDownload}>{t('admin.settings.guarder.piis.download')}</Button>
            <Button variant="outline" size="sm" onClick={handleHistoryToggle}>
              {showHistoryPanel ? t('admin.settings.guarder.piis.hideHistory') : t('admin.settings.guarder.piis.showHistory')}
            </Button>
            <Button size="sm" onClick={handleRiskSave} disabled={!riskDirty}>{t('admin.settings.guarder.piis.savePolicy')}</Button>
          </div>
        </div>

        {/* Summary mini-cards */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: t('admin.settings.guarder.piis.categoryCount'), value: `${riskSummary.catCount}` },
            { label: t('admin.settings.guarder.piis.itemCount'), value: `${riskSummary.itemCount}` },
            { label: t('admin.settings.guarder.piis.weightSum'), value: `${riskSummary.weightSum}%`, warn: riskSummary.weightSum !== 100 },
            { label: t('admin.settings.guarder.piis.gradeCount'), value: `${riskSummary.gradeCount}` },
          ].map((card: { label: string; value: string; warn?: boolean }) => (
            <div key={card.label} className="rounded-lg border border-border bg-card p-3 text-center">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className={`text-lg font-bold mt-0.5 ${card.warn ? 'text-orange-500' : 'text-foreground'}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Category cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {riskPolicy.categories.map((cat: RiskCategoryLocal) => (
            <div key={cat.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <input type="text" value={cat.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleRiskUpdateCategory(cat.id, 'name', e.target.value)}
                    className="text-sm font-semibold text-foreground bg-transparent border-none focus:outline-none focus:ring-0 w-32" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    {t('admin.settings.guarder.piis.weight')}
                    <input type="number" value={cat.weight}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleRiskUpdateCategory(cat.id, 'weight', e.target.value)}
                      className="w-14 px-1 py-0.5 text-xs text-center rounded border border-border bg-background text-foreground" min={0} max={100} />
                    %
                  </label>
                  <input type="color" value={cat.color}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleRiskUpdateCategory(cat.id, 'color', e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-none" />
                  <button onClick={() => handleRiskRemoveCategory(cat.id)}
                    className="text-red-500 hover:text-red-600 text-lg" title={t('admin.settings.guarder.piis.deleteCategory')}>
                    &times;
                  </button>
                </div>
              </div>

              {/* Items table */}
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left py-1.5 font-medium">{t('admin.settings.guarder.piis.detailItem')}</th>
                    <th className="text-center py-1.5 font-medium w-16">{t('admin.settings.guarder.piis.maxScore')}</th>
                    <th className="text-center py-1.5 font-medium w-16">{t('admin.settings.guarder.piis.riskMitigation')}</th>
                    <th className="text-center py-1.5 font-medium w-16">{t('admin.settings.guarder.piis.residual')}</th>
                    <th className="text-center py-1.5 font-medium w-20">{t('admin.governance.common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {cat.items.map((item: RiskItem, itemIdx: number) => (
                    <tr key={item.id}>
                      <td className="py-1.5">
                        <input type="text" value={item.name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleRiskUpdateItem(cat.id, item.id, 'name', e.target.value)}
                          className="w-full px-1 py-0.5 text-xs rounded border border-border bg-background text-foreground" />
                      </td>
                      <td className="py-1.5 text-center">
                        <input type="number" value={item.max_score}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleRiskUpdateItem(cat.id, item.id, 'max_score', e.target.value)}
                          className="w-12 px-1 py-0.5 text-xs text-center rounded border border-border bg-background text-foreground" min={0} />
                      </td>
                      <td className="py-1.5 text-center">
                        <input type="number" value={item.risk_mitigation}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleRiskUpdateItem(cat.id, item.id, 'risk_mitigation', e.target.value)}
                          className="w-12 px-1 py-0.5 text-xs text-center rounded border border-border bg-background text-foreground" min={0} />
                      </td>
                      <td className="py-1.5 text-center">
                        <span className="font-medium text-foreground">{item.max_score - item.risk_mitigation}</span>
                      </td>
                      <td className="py-1.5 text-center">
                        <div className="flex justify-center gap-0.5">
                          <button onClick={() => handleRiskMoveItem(cat.id, item.id, 'up')} disabled={itemIdx === 0}
                            className="px-1 text-muted-foreground hover:text-foreground disabled:opacity-30">&uarr;</button>
                          <button onClick={() => handleRiskMoveItem(cat.id, item.id, 'down')} disabled={itemIdx === cat.items.length - 1}
                            className="px-1 text-muted-foreground hover:text-foreground disabled:opacity-30">&darr;</button>
                          <button onClick={() => handleRiskRemoveItem(cat.id, item.id)}
                            className="px-1 text-red-500 hover:text-red-600">&times;</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={() => handleRiskAddItem(cat.id)}
                className="w-full mt-2 py-1.5 text-xs text-primary hover:bg-primary/5 rounded border border-dashed border-primary/30 transition-colors">
                + {t('admin.settings.guarder.piis.addItem')}
              </button>
            </div>
          ))}
        </div>

        {/* Grade levels */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-semibold text-foreground">{t('admin.settings.guarder.piis.gradeLevels')}</h4>
              <span className="text-xs text-muted-foreground">{t('admin.settings.guarder.piis.gradeLevelsHint')}</span>
            </div>
            <Button size="sm" onClick={handleRiskAddGrade}>+ {t('admin.settings.guarder.piis.addGrade')}</Button>
          </div>
          <div className="space-y-2">
            {riskPolicy.grade_levels.map((grade: GradeLevel) => (
              <div key={grade.id} className="flex items-center gap-3 p-2 rounded-lg border border-border bg-muted/20">
                <input type="color" value={grade.color}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleRiskUpdateGrade(grade.id, 'color', e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border-none" />
                <div className="flex items-center gap-1">
                  <input type="number" value={grade.min_score ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleRiskUpdateGrade(grade.id, 'min_score', e.target.value)}
                    className="w-16 px-2 py-1 text-xs rounded border border-border bg-background text-foreground text-center" placeholder={t('admin.settings.guarder.piis.minScore')} />
                  <span className="text-xs text-muted-foreground">~</span>
                  <input type="number" value={grade.max_score ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleRiskUpdateGrade(grade.id, 'max_score', e.target.value)}
                    className="w-16 px-2 py-1 text-xs rounded border border-border bg-background text-foreground text-center" placeholder={t('admin.settings.guarder.piis.maxScoreLabel')} />
                  <span className="text-xs text-muted-foreground">{t('admin.settings.guarder.piis.points')}</span>
                </div>
                <input type="text" value={grade.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleRiskUpdateGrade(grade.id, 'name', e.target.value)}
                  className="w-24 px-2 py-1 text-xs rounded border border-border bg-background text-foreground" placeholder={t('admin.settings.guarder.piis.gradeName')} />
                <input type="text" value={grade.management_policy}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleRiskUpdateGrade(grade.id, 'management_policy', e.target.value)}
                  className="flex-1 px-2 py-1 text-xs rounded border border-border bg-background text-foreground" placeholder={t('admin.settings.guarder.piis.managementPolicy')} />
                <button onClick={() => handleRiskRemoveGrade(grade.id)}
                  className="text-red-500 hover:text-red-600 text-lg">&times;</button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer notes */}
        <div className="text-xs text-muted-foreground space-y-0.5 px-1">
          <p>{t('admin.settings.guarder.piis.riskNote1')}</p>
          <p>{t('admin.settings.guarder.piis.riskNote2')}</p>
          <p>{t('admin.settings.guarder.piis.riskNote3')}</p>
        </div>

        {/* History panel */}
        {showHistoryPanel && (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-foreground">{t('admin.settings.guarder.piis.policyHistory')}</h4>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleClearHistory} className="text-red-500">{t('admin.settings.guarder.piis.clearHistory')}</Button>
                <Button variant="outline" size="sm" onClick={() => setShowHistoryPanel(false)}>{t('admin.settings.guarder.piis.close')}</Button>
              </div>
            </div>
            <div className="space-y-2">
              {riskVersions.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">{t('admin.settings.guarder.piis.noHistory')}</p>}
              {riskVersions.map((v: RiskPolicyVersion) => (
                <div key={v.version} className={`p-3 rounded-lg border ${v.is_active ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/20'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-foreground">v{v.version}</span>
                    {v.is_active && <span className="px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-medium">{t('admin.settings.guarder.piis.activeLabel')}</span>}
                  </div>
                  {v.change_summary && <p className="text-xs text-muted-foreground">{v.change_summary}</p>}
                  <span className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleString('ko-KR')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ================================================================ */
  /*  Main Render                                                      */
  /* ================================================================ */
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-6">
        {/* Top summary cards */}
        <div className="grid grid-cols-5 gap-3">
          <StatCard
            label={t('admin.settings.guarder.piis.totalPolicies')}
            value={combinedStats.totalAll}
            variant="neutral"
          />
          <StatCard
            label={t('admin.settings.guarder.piis.piiPolicies')}
            value={combinedStats.piiCount}
            accentColor="#7c3aed"
          />
          <StatCard
            label={t('admin.settings.guarder.piis.forbiddenWordPolicies')}
            value={combinedStats.fwCount}
            variant="warning"
          />
          <StatCard
            label={t('admin.settings.guarder.piis.activePolicies')}
            value={combinedStats.activeAll}
            variant="success"
          />
          <div className="relative rounded-xl border bg-card p-4 transition-all duration-200 border-border" style={{ borderLeftWidth: 4, borderLeftColor: 'var(--color-gray-400, #abb1ba)' }}>
            <div className="flex flex-col gap-0.5 min-w-0">
              <p className="text-xs font-medium text-muted-foreground">{t('admin.settings.guarder.piis.riskGrades')}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-2xl font-bold text-foreground">{riskSummary.gradeCount}</span>
                <div className="flex gap-0.5 h-4">
                  {riskColors.map((color: string, idx: number) => (
                    <div key={idx} className="w-3 rounded-sm" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border">
          <button
            className={`flex items-center gap-1.5 pb-2 px-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pii' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => handleTabChange('pii')}>
            <span>{'\uD83D\uDEE1'}</span>
            {t('admin.settings.guarder.piis.piiTab')}
            <span className="text-xs text-muted-foreground ml-1">({piisList.length})</span>
          </button>
          <button
            className={`flex items-center gap-1.5 pb-2 px-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'forbidden_words' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => handleTabChange('forbidden_words')}>
            <span>{'\uD83D\uDEAB'}</span>
            {t('admin.settings.guarder.piis.forbiddenWordTab')}
            <span className="text-xs text-muted-foreground ml-1">({fwList.length})</span>
          </button>
          <button
            className={`flex items-center gap-1.5 pb-2 px-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'risk_level' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => handleTabChange('risk_level')}>
            <span>{'\u26A0'}</span>
            {t('admin.settings.guarder.piis.riskLevelTab')}
            <span className="text-xs text-muted-foreground ml-1">({riskSummary.gradeCount})</span>
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'risk_level' ? (
          renderRiskLevel()
        ) : viewMode === 'list' ? (
          renderPolicyList()
        ) : (
          renderForm()
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={t('admin.governance.common.confirmDelete')}>
          <div className="p-4">
            <p className="text-sm text-foreground mb-4">
              {t('admin.settings.guarder.piis.deleteConfirmMessage', { name: deleteTarget.name })}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>{t('admin.settings.guarder.piis.cancel')}</Button>
              <Button onClick={() => handleDelete(deleteTarget.id)} className="bg-red-500 hover:bg-red-600 text-white">{t('admin.governance.common.delete')}</Button>
            </div>
          </div>
        </Modal>
      )}
    </ContentArea>
  );
};

/* ------------------------------------------------------------------ */
/*  Feature Module Export                                               */
/* ------------------------------------------------------------------ */
const feature: AdminFeatureModule = {
  id: 'admin-gov-control-policy',
  name: 'AdminGovControlPolicyPage',
  adminSection: 'admin-governance',
  routes: {
    'admin-gov-control-policy': AdminGovControlPolicyPage,
  },
};

export default feature;
