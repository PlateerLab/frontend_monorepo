'use client';

import React, { useState, useCallback, useEffect } from 'react';
import type { AuthProfile } from '@xgen/types';
import { Button, useToast } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import {
  createAuthProfileFull,
  updateAuthProfileFull,
  testAuthProfileFull,
  getAuthProfileDetail,
  parseRules,
  type ExtractionRule,
  type InjectionRule,
  type AuthProfileCreatePayload,
  type FullTestResult,
} from './api';

// ─────────────────────────────────────────────────────────────
// Icons (inline SVG)
// ─────────────────────────────────────────────────────────────

const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const SaveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
    <polyline points="17,21 17,13 7,13 7,21" />
    <polyline points="7,3 7,8 15,8" />
  </svg>
);

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3,6 5,6 21,6" />
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
);

const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5,3 19,12 5,21 5,3" />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const HelpIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Tooltip helper
// ─────────────────────────────────────────────────────────────

const Tip: React.FC<{ text: string }> = ({ text }) => (
  <span className="relative inline-flex items-center ml-1 text-gray-400 cursor-help group">
    <HelpIcon />
    <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 hidden group-hover:block w-56 px-3 py-2 text-xs text-white bg-gray-800 rounded-md shadow-lg whitespace-normal">
      {text}
    </span>
  </span>
);

// ─────────────────────────────────────────────────────────────
// Tab types
// ─────────────────────────────────────────────────────────────

type FormTab = 'basic' | 'api' | 'rules';

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────

export interface AuthProfileFormProps {
  editingProfile?: AuthProfile | null;
  onBack: () => void;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

const AuthProfileForm: React.FC<AuthProfileFormProps> = ({ editingProfile, onBack }) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const isEdit = !!editingProfile;

  const [activeTab, setActiveTab] = useState<FormTab>('basic');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<FullTestResult | null>(null);

  // Basic fields
  const [serviceId, setServiceId] = useState(editingProfile?.serviceId ?? '');
  const [name, setName] = useState(editingProfile?.name ?? '');
  const [description, setDescription] = useState(editingProfile?.description ?? '');
  const [authType, setAuthType] = useState<string>(editingProfile?.authType ?? 'bearer');
  const [ttl, setTtl] = useState(3600);

  // Login Config
  const [loginUrl, setLoginUrl] = useState('');
  const [loginMethod, setLoginMethod] = useState('POST');
  const [loginHeadersText, setLoginHeadersText] = useState('{}');
  const [loginPayloadText, setLoginPayloadText] = useState('{}');
  const [loginTimeout, setLoginTimeout] = useState(30);

  // Rules
  const [extractionRules, setExtractionRules] = useState<ExtractionRule[]>([]);
  const [injectionRules, setInjectionRules] = useState<InjectionRule[]>([]);

  // Load full profile data for edit mode (login_config, rules, ttl)
  useEffect(() => {
    if (!editingProfile) return;
    let cancelled = false;
    setLoading(true);
    getAuthProfileDetail(editingProfile.serviceId)
      .then((raw) => {
        if (cancelled) return;
        setAuthType(raw.auth_type ?? 'bearer');
        setTtl(raw.ttl ?? 3600);
        if (raw.login_config) {
          setLoginUrl(raw.login_config.url ?? '');
          setLoginMethod(raw.login_config.method ?? 'POST');
          setLoginHeadersText(JSON.stringify(raw.login_config.headers ?? {}, null, 2));
          setLoginPayloadText(JSON.stringify(raw.login_config.payload ?? {}, null, 2));
          setLoginTimeout(raw.login_config.timeout ?? 30);
        }
        setExtractionRules(parseRules<ExtractionRule>(raw.extraction_rules));
        setInjectionRules(parseRules<InjectionRule>(raw.injection_rules));
      })
      .catch(() => {
        if (!cancelled) {
          toast.error(t('authProfileStorage.form.toast.loadFailed'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [editingProfile, t, toast]);

  // ── Save ──

  const handleSave = useCallback(async () => {
    if (!serviceId.trim()) {
      toast.error(t('authProfileStorage.form.validation.serviceIdRequired'));
      return;
    }
    if (!name.trim()) {
      toast.error(t('authProfileStorage.form.validation.nameRequired'));
      return;
    }
    if (!loginUrl.trim()) {
      toast.error(t('authProfileStorage.form.validation.loginUrlRequired'));
      return;
    }

    let parsedHeaders: Record<string, string> = {};
    let parsedPayload: Record<string, unknown> = {};
    try {
      parsedHeaders = JSON.parse(loginHeadersText);
    } catch {
      toast.error(t('authProfileStorage.form.validation.invalidHeadersJson'));
      return;
    }
    try {
      parsedPayload = JSON.parse(loginPayloadText);
    } catch {
      toast.error(t('authProfileStorage.form.validation.invalidPayloadJson'));
      return;
    }

    const payload: AuthProfileCreatePayload = {
      service_id: serviceId,
      name,
      description: description || null,
      auth_type: authType,
      login_config: {
        url: loginUrl,
        method: loginMethod,
        headers: parsedHeaders,
        payload: parsedPayload,
        timeout: loginTimeout,
      },
      extraction_rules: extractionRules,
      injection_rules: injectionRules,
      ttl,
    };

    setSaving(true);
    try {
      if (isEdit && editingProfile) {
        await updateAuthProfileFull(editingProfile.serviceId, payload);
        toast.success(t('authProfileStorage.form.toast.updateSuccess'));
      } else {
        await createAuthProfileFull(payload);
        toast.success(t('authProfileStorage.form.toast.createSuccess'));
      }
      onBack();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('authProfileStorage.form.toast.saveFailed'));
    } finally {
      setSaving(false);
    }
  }, [
    serviceId, name, description, authType, ttl,
    loginUrl, loginMethod, loginHeadersText, loginPayloadText, loginTimeout,
    extractionRules, injectionRules,
    isEdit, editingProfile, onBack, t, toast,
  ]);

  // ── Test ──

  const handleTest = useCallback(async () => {
    if (!isEdit || !editingProfile) {
      toast.error(t('authProfileStorage.form.validation.testOnlyEditMode'));
      return;
    }
    setTesting(true);
    try {
      const result = await testAuthProfileFull(editingProfile.serviceId);
      setTestResult(result);
      if (result.success) {
        toast.success(t('authProfileStorage.form.toast.testSuccess'));
      } else {
        toast.error(result.message || t('authProfileStorage.form.toast.testFailed'));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('authProfileStorage.form.toast.testFailed'));
    } finally {
      setTesting(false);
    }
  }, [isEdit, editingProfile, t, toast]);

  // ── Extraction Rules Handlers ──

  const addExtractionRule = useCallback(() => {
    setExtractionRules((prev) => [...prev, { name: '', source: 'body', key_path: '', value: null }]);
  }, []);

  const removeExtractionRule = useCallback((idx: number) => {
    setExtractionRules((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const updateExtractionRule = useCallback((idx: number, field: string, val: string) => {
    setExtractionRules((prev) => {
      const updated = [...prev];
      if (field === 'source' && val === 'fixed') {
        updated[idx] = { ...updated[idx], source: 'fixed' as const, value: updated[idx].key_path || '', key_path: '' };
      } else if (field === 'source' && updated[idx].source === 'fixed') {
        updated[idx] = { ...updated[idx], source: val as ExtractionRule['source'], key_path: updated[idx].value || '', value: null };
      } else {
        updated[idx] = { ...updated[idx], [field]: val };
      }
      return updated;
    });
  }, []);

  // ── Injection Rules Handlers ──

  const addInjectionRule = useCallback(() => {
    setInjectionRules((prev) => [...prev, { source_field: '', target: 'header', key: '', value_template: '', required: false }]);
  }, []);

  const removeInjectionRule = useCallback((idx: number) => {
    setInjectionRules((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const updateInjectionRule = useCallback((idx: number, field: string, val: string | boolean) => {
    setInjectionRules((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
  }, []);

  // ── Tab config ──

  const tabItems: { key: FormTab; label: string }[] = [
    { key: 'basic', label: t('authProfileStorage.form.tabs.basic') },
    { key: 'api', label: t('authProfileStorage.form.tabs.api') },
    { key: 'rules', label: t('authProfileStorage.form.tabs.rules') },
  ];

  // ── Loading state ──

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ArrowLeftIcon />
            {t('authProfileStorage.form.back')}
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? t('authProfileStorage.form.editTitle') : t('authProfileStorage.form.title')}
          </h2>
        </div>
        <Button onClick={handleSave} disabled={saving} size="sm">
          <SaveIcon />
          <span className="ml-1.5">{saving ? t('authProfileStorage.form.saving') : t('authProfileStorage.form.save')}</span>
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 px-6 pt-4 pb-0">
        {tabItems.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 border border-b-0 border-gray-200'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 bg-white border-t border-gray-200">
        {/* ── Basic Settings Tab ── */}
        {activeTab === 'basic' && (
          <div className="max-w-3xl space-y-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('authProfileStorage.form.basic.title')}</h3>

            {/* Service ID */}
            <div className="grid grid-cols-[240px_1fr] gap-4 items-start">
              <div>
                <div className="text-sm font-medium text-gray-700">
                  {t('authProfileStorage.form.basic.serviceId')} <span className="text-red-500">*</span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{t('authProfileStorage.form.basic.serviceIdDesc')}</div>
              </div>
              <input
                type="text"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                placeholder={t('authProfileStorage.form.basic.serviceIdPlaceholder')}
                disabled={isEdit}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>

            {/* Name */}
            <div className="grid grid-cols-[240px_1fr] gap-4 items-start">
              <div>
                <div className="text-sm font-medium text-gray-700">
                  {t('authProfileStorage.form.basic.name')} <span className="text-red-500">*</span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{t('authProfileStorage.form.basic.nameDesc')}</div>
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('authProfileStorage.form.basic.namePlaceholder')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div className="grid grid-cols-[240px_1fr] gap-4 items-start">
              <div>
                <div className="text-sm font-medium text-gray-700">{t('authProfileStorage.form.basic.description')}</div>
                <div className="text-xs text-gray-500 mt-0.5">{t('authProfileStorage.form.basic.descriptionDesc')}</div>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('authProfileStorage.form.basic.descriptionPlaceholder')}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Auth Type */}
            <div className="grid grid-cols-[240px_1fr] gap-4 items-start">
              <div>
                <div className="text-sm font-medium text-gray-700">{t('authProfileStorage.form.basic.authType')}</div>
                <div className="text-xs text-gray-500 mt-0.5">{t('authProfileStorage.form.basic.authTypeDesc')}</div>
              </div>
              <select
                value={authType}
                onChange={(e) => setAuthType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="bearer">Bearer Token</option>
                <option value="cookie">Cookie</option>
                <option value="api_key">API Key</option>
                <option value="oauth2">OAuth2</option>
              </select>
            </div>

            {/* TTL */}
            <div className="grid grid-cols-[240px_1fr] gap-4 items-start">
              <div>
                <div className="text-sm font-medium text-gray-700">{t('authProfileStorage.form.basic.ttl')}</div>
                <div className="text-xs text-gray-500 mt-0.5">{t('authProfileStorage.form.basic.ttlDesc')}</div>
              </div>
              <input
                type="number"
                value={ttl}
                onChange={(e) => setTtl(Number(e.target.value))}
                min={60}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* ── Auth API Tab ── */}
        {activeTab === 'api' && (
          <div className="max-w-3xl space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">{t('authProfileStorage.form.api.title')}</h3>
              {isEdit && (
                <button
                  onClick={handleTest}
                  disabled={testing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 disabled:opacity-50 transition-colors"
                >
                  <PlayIcon />
                  {testing ? t('authProfileStorage.form.api.testing') : t('authProfileStorage.form.api.test')}
                </button>
              )}
            </div>

            {/* Login URL */}
            <div className="grid grid-cols-[240px_1fr] gap-4 items-start">
              <div>
                <div className="text-sm font-medium text-gray-700">
                  {t('authProfileStorage.form.api.url')} <span className="text-red-500">*</span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{t('authProfileStorage.form.api.urlDesc')}</div>
              </div>
              <input
                type="text"
                value={loginUrl}
                onChange={(e) => setLoginUrl(e.target.value)}
                placeholder="https://api.example.com/auth/login"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Method */}
            <div className="grid grid-cols-[240px_1fr] gap-4 items-start">
              <div>
                <div className="text-sm font-medium text-gray-700">{t('authProfileStorage.form.api.method')}</div>
                <div className="text-xs text-gray-500 mt-0.5">{t('authProfileStorage.form.api.methodDesc')}</div>
              </div>
              <select
                value={loginMethod}
                onChange={(e) => setLoginMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="POST">POST</option>
                <option value="GET">GET</option>
                <option value="PUT">PUT</option>
              </select>
            </div>

            {/* Timeout */}
            <div className="grid grid-cols-[240px_1fr] gap-4 items-start">
              <div>
                <div className="text-sm font-medium text-gray-700">{t('authProfileStorage.form.api.timeout')}</div>
                <div className="text-xs text-gray-500 mt-0.5">{t('authProfileStorage.form.api.timeoutDesc')}</div>
              </div>
              <input
                type="number"
                value={loginTimeout}
                onChange={(e) => setLoginTimeout(Number(e.target.value))}
                min={1}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Headers */}
            <div className="grid grid-cols-[240px_1fr] gap-4 items-start">
              <div>
                <div className="text-sm font-medium text-gray-700">{t('authProfileStorage.form.api.headers')}</div>
                <div className="text-xs text-gray-500 mt-0.5">{t('authProfileStorage.form.api.headersDesc')}</div>
              </div>
              <textarea
                value={loginHeadersText}
                onChange={(e) => setLoginHeadersText(e.target.value)}
                rows={4}
                placeholder={'{"Content-Type": "application/json"}'}
                className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Payload */}
            <div className="grid grid-cols-[240px_1fr] gap-4 items-start">
              <div>
                <div className="text-sm font-medium text-gray-700">{t('authProfileStorage.form.api.payload')}</div>
                <div className="text-xs text-gray-500 mt-0.5">{t('authProfileStorage.form.api.payloadDesc')}</div>
              </div>
              <textarea
                value={loginPayloadText}
                onChange={(e) => setLoginPayloadText(e.target.value)}
                rows={6}
                placeholder={'{"username": "user", "password": "pass"}'}
                className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        )}

        {/* ── Rules Tab ── */}
        {activeTab === 'rules' && (
          <div className="max-w-4xl space-y-8">
            {/* Extraction Rules */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{t('authProfileStorage.form.rules.extraction.title')}</h3>
              <p className="text-xs text-gray-500 mb-4">{t('authProfileStorage.form.rules.extraction.description')}</p>

              {extractionRules.length > 0 && (
                <div className="grid grid-cols-[1fr_120px_1fr_36px] gap-2 mb-2">
                  <div className="text-xs font-medium text-gray-500 flex items-center">
                    {t('authProfileStorage.form.rules.extraction.name')}
                    <Tip text={t('authProfileStorage.form.rules.extraction.nameTip')} />
                  </div>
                  <div className="text-xs font-medium text-gray-500 flex items-center">
                    {t('authProfileStorage.form.rules.extraction.source')}
                    <Tip text={t('authProfileStorage.form.rules.extraction.sourceTip')} />
                  </div>
                  <div className="text-xs font-medium text-gray-500 flex items-center">
                    {t('authProfileStorage.form.rules.extraction.keyPath')}
                    <Tip text={t('authProfileStorage.form.rules.extraction.keyPathTip')} />
                  </div>
                  <div />
                </div>
              )}

              {extractionRules.map((rule, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_120px_1fr_36px] gap-2 items-center mb-2">
                  <input
                    type="text"
                    value={rule.name}
                    onChange={(e) => updateExtractionRule(idx, 'name', e.target.value)}
                    placeholder={t('authProfileStorage.form.rules.extraction.namePlaceholder')}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <select
                    value={rule.source}
                    onChange={(e) => updateExtractionRule(idx, 'source', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="body">body</option>
                    <option value="header">header</option>
                    <option value="cookie">cookie</option>
                    <option value="fixed">fixed</option>
                  </select>
                  <input
                    type="text"
                    value={rule.source === 'fixed' ? (rule.value || '') : (rule.key_path || '')}
                    onChange={(e) => updateExtractionRule(idx, rule.source === 'fixed' ? 'value' : 'key_path', e.target.value)}
                    placeholder={
                      rule.source === 'fixed'
                        ? t('authProfileStorage.form.rules.extraction.fixedValuePlaceholder')
                        : t('authProfileStorage.form.rules.extraction.keyPathPlaceholder')
                    }
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => removeExtractionRule(idx)}
                    className="flex items-center justify-center w-8 h-8 text-red-500 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}

              <button
                onClick={addExtractionRule}
                className="flex items-center gap-1.5 mt-2 px-3 py-1.5 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
              >
                <PlusIcon />
                {t('authProfileStorage.form.rules.extraction.addRule')}
              </button>
            </div>

            {/* Injection Rules */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{t('authProfileStorage.form.rules.injection.title')}</h3>
              <p className="text-xs text-gray-500 mb-4">{t('authProfileStorage.form.rules.injection.description')}</p>

              {injectionRules.length > 0 && (
                <div className="grid grid-cols-[1fr_120px_1fr_2fr_36px] gap-2 mb-2">
                  <div className="text-xs font-medium text-gray-500 flex items-center">
                    {t('authProfileStorage.form.rules.injection.sourceField')}
                    <Tip text={t('authProfileStorage.form.rules.injection.sourceFieldTip')} />
                  </div>
                  <div className="text-xs font-medium text-gray-500 flex items-center">
                    {t('authProfileStorage.form.rules.injection.target')}
                    <Tip text={t('authProfileStorage.form.rules.injection.targetTip')} />
                  </div>
                  <div className="text-xs font-medium text-gray-500 flex items-center">
                    {t('authProfileStorage.form.rules.injection.key')}
                    <Tip text={t('authProfileStorage.form.rules.injection.keyTip')} />
                  </div>
                  <div className="text-xs font-medium text-gray-500 flex items-center">
                    {t('authProfileStorage.form.rules.injection.valueTemplate')}
                    <Tip text={t('authProfileStorage.form.rules.injection.valueTemplateTip')} />
                  </div>
                  <div />
                </div>
              )}

              {injectionRules.map((rule, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_120px_1fr_2fr_36px] gap-2 items-center mb-2">
                  <input
                    type="text"
                    value={rule.source_field}
                    onChange={(e) => updateInjectionRule(idx, 'source_field', e.target.value)}
                    placeholder={t('authProfileStorage.form.rules.injection.sourceFieldPlaceholder')}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <select
                    value={rule.target}
                    onChange={(e) => updateInjectionRule(idx, 'target', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="header">header</option>
                    <option value="cookie">cookie</option>
                    <option value="query">query</option>
                    <option value="body">body</option>
                  </select>
                  <input
                    type="text"
                    value={rule.key}
                    onChange={(e) => updateInjectionRule(idx, 'key', e.target.value)}
                    placeholder={t('authProfileStorage.form.rules.injection.keyPlaceholder')}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    value={rule.value_template}
                    onChange={(e) => updateInjectionRule(idx, 'value_template', e.target.value)}
                    placeholder={t('authProfileStorage.form.rules.injection.valueTemplatePlaceholder')}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => removeInjectionRule(idx)}
                    className="flex items-center justify-center w-8 h-8 text-red-500 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}

              <button
                onClick={addInjectionRule}
                className="flex items-center gap-1.5 mt-2 px-3 py-1.5 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
              >
                <PlusIcon />
                {t('authProfileStorage.form.rules.injection.addRule')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Test Result Modal */}
      {testResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setTestResult(null)}
        >
          <div
            className="bg-white rounded-xl w-[90%] max-w-[700px] max-h-[80vh] overflow-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">{t('authProfileStorage.form.testResult.title')}</h3>
              <button onClick={() => setTestResult(null)} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                <CloseIcon />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="flex items-center gap-2">
                <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded ${testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {testResult.success ? 'SUCCESS' : 'FAILED'}
                </span>
                {testResult.message && <span className="text-sm text-gray-600">{testResult.message}</span>}
              </div>

              {testResult.extractedContext && Object.keys(testResult.extractedContext).length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-green-700 mb-1.5">{t('authProfileStorage.form.testResult.extractedContext')}</h4>
                  <pre className="bg-green-50 border border-green-200 rounded-md p-3 text-xs overflow-x-auto whitespace-pre-wrap break-all">
                    {JSON.stringify(testResult.extractedContext, null, 2)}
                  </pre>
                </div>
              )}

              {testResult.responseHeaders && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 mb-1.5">{t('authProfileStorage.form.testResult.responseHeaders')}</h4>
                  <pre className="bg-gray-50 border border-gray-200 rounded-md p-3 text-[11px] overflow-x-auto whitespace-pre-wrap break-all max-h-[200px]">
                    {JSON.stringify(testResult.responseHeaders, null, 2)}
                  </pre>
                </div>
              )}

              {testResult.responseBody != null && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 mb-1.5">{t('authProfileStorage.form.testResult.responseBody')}</h4>
                  <pre className="bg-gray-50 border border-gray-200 rounded-md p-3 text-[11px] overflow-x-auto whitespace-pre-wrap break-all max-h-[200px]">
                    {typeof testResult.responseBody === 'string'
                      ? testResult.responseBody
                      : JSON.stringify(testResult.responseBody as Record<string, unknown>, null, 2)}
                  </pre>
                </div>
              )}

              {testResult.extractionRules && testResult.extractionRules.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 mb-1.5">{t('authProfileStorage.form.testResult.appliedRules')}</h4>
                  <pre className="bg-gray-50 border border-gray-200 rounded-md p-3 text-[11px] overflow-x-auto whitespace-pre-wrap break-all max-h-[150px]">
                    {JSON.stringify(testResult.extractionRules, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t border-gray-200 text-right">
              <button onClick={() => setTestResult(null)} className="px-4 py-1.5 text-sm border border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
                {t('authProfileStorage.form.testResult.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthProfileForm;
