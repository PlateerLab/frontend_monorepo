'use client';

import React, { useState, useCallback } from 'react';
import { Button, Input, Label, Textarea, Switch, useToast, StatusBadge } from '@xgen/ui';
import {
  FiArrowLeft, FiArrowRight, FiSearch, FiRefreshCw, FiPlay,
  FiCheck, FiAlertCircle, FiSave, FiChevronDown, FiChevronUp,
  FiPlus, FiTrash2,
} from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { saveTool, testApiEndpoint, discoverApis } from './api';
import type { ToolSaveData, DiscoveredEndpoint, DiscoveryResult, ApiTestResult } from './api';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ToolEasyModeProps {
  onBack: () => void;
  onSwitchToDevMode: (prefillData?: Partial<ToolSaveData>) => void;
}

interface KVPair {
  key: string;
  value: string;
}

interface DynamicParam {
  key: string;
  description: string;
}

const STEPS = ['basic', 'headers', 'params', 'review'] as const;
type Step = (typeof STEPS)[number];

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  POST: 'bg-blue-100 text-blue-700 border-blue-200',
  PUT: 'bg-amber-100 text-amber-700 border-amber-200',
  DELETE: 'bg-red-100 text-red-700 border-red-200',
  PATCH: 'bg-purple-100 text-purple-700 border-purple-200',
};

// ─────────────────────────────────────────────────────────────
// Easy Mode Component
// ─────────────────────────────────────────────────────────────

export const ToolEasyMode: React.FC<ToolEasyModeProps> = ({ onBack, onSwitchToDevMode }) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  // Discovery
  const [urlInput, setUrlInput] = useState('');
  const [discovering, setDiscovering] = useState(false);
  const [discoveryError, setDiscoveryError] = useState('');
  const [discoveryResult, setDiscoveryResult] = useState<DiscoveryResult | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<DiscoveredEndpoint | null>(null);

  // Endpoint test
  const [testingUrl, setTestingUrl] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ endpoint: DiscoveredEndpoint; success: boolean; data: ApiTestResult['data']; error?: string } | null>(null);
  const [showTestResponse, setShowTestResponse] = useState(true);

  // Wizard
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [toolName, setToolName] = useState('');
  const [toolId, setToolId] = useState('');
  const [idManuallyEdited, setIdManuallyEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [headers, setHeaders] = useState<KVPair[]>([]);
  const [staticParams, setStaticParams] = useState<KVPair[]>([]);
  const [dynamicParams, setDynamicParams] = useState<DynamicParam[]>([]);
  const [isQueryString, setIsQueryString] = useState(false);
  const [saving, setSaving] = useState(false);

  // Helpers
  const autoGenerateId = (name: string): string =>
    name.toLowerCase().replace(/[가-힣ㄱ-ㅎㅏ-ㅣ]+/g, '').replace(/[^a-z0-9\s_]/g, '').replace(/\s+/g, '_').replace(/^_+|_+$/g, '').replace(/_+/g, '_') || '';

  const handleToolNameChange = (value: string) => {
    setToolName(value);
    if (!idManuallyEdited) setToolId(autoGenerateId(value));
  };

  const currentStepIndex = STEPS.indexOf(currentStep);
  const goNext = () => { const idx = STEPS.indexOf(currentStep); if (idx < STEPS.length - 1) setCurrentStep(STEPS[idx + 1]); };
  const goPrev = () => { const idx = STEPS.indexOf(currentStep); if (idx > 0) setCurrentStep(STEPS[idx - 1]); };

  const canGoNext = (): boolean => {
    if (currentStep === 'basic') return !!(toolName.trim() && toolId.trim() && description.trim());
    return true;
  };

  // KV helpers
  const addHeader = () => setHeaders((p) => [...p, { key: '', value: '' }]);
  const removeHeader = (idx: number) => setHeaders((p) => p.filter((_, i) => i !== idx));
  const updateHeader = (idx: number, field: 'key' | 'value', val: string) =>
    setHeaders((p) => p.map((h, i) => (i === idx ? { ...h, [field]: val } : h)));

  const addStaticParam = () => setStaticParams((p) => [...p, { key: '', value: '' }]);
  const removeStaticParam = (idx: number) => setStaticParams((p) => p.filter((_, i) => i !== idx));
  const updateStaticParam = (idx: number, field: 'key' | 'value', val: string) =>
    setStaticParams((p) => p.map((s, i) => (i === idx ? { ...s, [field]: val } : s)));

  const addDynamicParam = () => setDynamicParams((p) => [...p, { key: '', description: '' }]);
  const removeDynamicParam = (idx: number) => setDynamicParams((p) => p.filter((_, i) => i !== idx));
  const updateDynamicParam = (idx: number, field: 'key' | 'description', val: string) =>
    setDynamicParams((p) => p.map((d, i) => (i === idx ? { ...d, [field]: val } : d)));

  const resetWizard = () => {
    setCurrentStep('basic');
    setToolName('');
    setToolId('');
    setDescription('');
    setIdManuallyEdited(false);
    setHeaders([]);
    setStaticParams([]);
    setDynamicParams([]);
    setIsQueryString(false);
  };

  // ─── Discovery ────────────────────────────────────────────

  const handleDiscover = useCallback(async () => {
    const url = urlInput.trim();
    if (!url) { setDiscoveryError(t('toolManagementStorage.easyMode.error.urlEmpty')); return; }

    setDiscovering(true);
    setDiscoveryError('');
    setDiscoveryResult(null);
    setSelectedEndpoint(null);
    setTestResult(null);
    resetWizard();

    try {
      const result = await discoverApis(url);
      setDiscoveryResult(result);
      if (result.total_found > 0) {
        toast.success(t('toolManagementStorage.easyMode.discoverSuccess', { count: result.total_found }));
      } else {
        setDiscoveryError(t('toolManagementStorage.easyMode.discoverEmpty'));
      }
    } catch (err) {
      setDiscoveryError(err instanceof Error ? err.message : t('toolManagementStorage.easyMode.error.discoverFailed'));
    } finally {
      setDiscovering(false);
    }
  }, [urlInput, t, toast]);

  // ─── Endpoint Test ────────────────────────────────────────

  const handleTestEndpoint = useCallback(async (ep: DiscoveredEndpoint) => {
    setTestingUrl(ep.url);
    setTestResult(null);
    try {
      const result = await testApiEndpoint({
        api_url: ep.full_url,
        api_method: ep.method || 'GET',
        api_headers: {},
        api_body: {},
        static_body: {},
        body_type: '',
        is_query_string: false,
        html_parser: true,
        api_timeout: 15,
      });
      setTestResult({ endpoint: ep, success: result.success, data: result.data, error: result.error });
      setShowTestResponse(true);
    } catch (err) {
      setTestResult({ endpoint: ep, success: false, data: undefined, error: err instanceof Error ? err.message : 'Unknown error' });
      setShowTestResponse(true);
    } finally {
      setTestingUrl(null);
    }
  }, []);

  // ─── Endpoint Select ──────────────────────────────────────

  const handleSelectEndpoint = useCallback((ep: DiscoveredEndpoint) => {
    setSelectedEndpoint(ep);
    setCurrentStep('basic');

    const path = ep.url.replace(/^\//, '').replace(/\//g, ' ').replace(/[-_]/g, ' ').replace(/[{}]/g, '');
    const defaultName = path.split(' ').filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ').trim();

    if (!toolName) {
      setToolName(defaultName || 'API Tool');
      setToolId(autoGenerateId(defaultName || 'api_tool'));
      setIdManuallyEdited(false);
    }

    const qp = ep.query_params || {};
    const qpKeys = Object.keys(qp);
    if (qpKeys.length > 0) {
      setStaticParams(qpKeys.map((k) => ({ key: k, value: qp[k] })));
      setIsQueryString(true);
    } else {
      setStaticParams([]);
      setIsQueryString(ep.method.toUpperCase() === 'GET');
    }
    setHeaders([]);
    setDynamicParams([]);
  }, [toolName]);

  // ─── Save ─────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!selectedEndpoint) return;
    if (!toolName.trim() || !toolId.trim() || !description.trim()) {
      toast.error(t('toolManagementStorage.easyMode.error.requiredFields'));
      return;
    }

    const headerObj: Record<string, string> = {};
    headers.forEach((h) => { if (h.key.trim()) headerObj[h.key.trim()] = h.value; });

    const staticObj: Record<string, string> = {};
    staticParams.forEach((p) => { if (p.key.trim()) staticObj[p.key.trim()] = p.value; });

    const dynamicProperties: Record<string, unknown> = {};
    const requiredFields: string[] = [];
    dynamicParams.forEach((p) => {
      if (p.key.trim()) {
        dynamicProperties[p.key.trim()] = { type: 'string', description: p.description || p.key };
        requiredFields.push(p.key.trim());
      }
    });

    const toolData: ToolSaveData = {
      function_name: toolName.trim(),
      function_id: toolId.trim(),
      description: description.trim(),
      api_url: selectedEndpoint.full_url,
      api_method: selectedEndpoint.method || 'GET',
      api_header: headerObj,
      api_body: Object.keys(dynamicProperties).length > 0 ? { properties: dynamicProperties, required: requiredFields } : {},
      static_body: staticObj,
      body_type: Object.keys(dynamicProperties).length > 0 ? 'application/json' : '',
      api_timeout: 30,
      is_query_string: isQueryString,
      response_filter: false,
      html_parser: false,
      response_filter_path: '',
      response_filter_field: '',
      status: 'active',
      metadata: {},
    };

    setSaving(true);
    try {
      await saveTool(toolData.function_name, toolData);
      toast.success(t('toolManagementStorage.easyMode.saveSuccess'));
      onBack();
    } catch (err) {
      toast.error(t('toolManagementStorage.easyMode.saveFailed'));
    } finally {
      setSaving(false);
    }
  }, [selectedEndpoint, toolName, toolId, description, headers, staticParams, dynamicParams, isQueryString, t, toast, onBack]);

  // ─── Switch to Dev ────────────────────────────────────────

  const handleSwitchToDevMode = useCallback(() => {
    if (selectedEndpoint) {
      onSwitchToDevMode({
        function_name: toolName,
        function_id: toolId,
        description,
        api_url: selectedEndpoint.full_url,
        api_method: selectedEndpoint.method || 'GET',
      });
    } else {
      onSwitchToDevMode();
    }
  }, [selectedEndpoint, toolName, toolId, description, onSwitchToDevMode]);

  const getMethodColor = (method: string) => METHOD_COLORS[method.toUpperCase()] || METHOD_COLORS.GET;

  // ─── KV Row Renderer ─────────────────────────────────────

  const renderKVRows = (
    items: KVPair[],
    onUpdate: (idx: number, field: 'key' | 'value', val: string) => void,
    onRemove: (idx: number) => void,
    keyPH: string,
    valPH: string,
  ) => (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Input className="flex-1" value={item.key} onChange={(e) => onUpdate(idx, 'key', e.target.value)} placeholder={keyPH} />
          <Input className="flex-1" value={item.value} onChange={(e) => onUpdate(idx, 'value', e.target.value)} placeholder={valPH} />
          <Button variant="ghost" size="sm" onClick={() => onRemove(idx)}><FiTrash2 /></Button>
        </div>
      ))}
    </div>
  );

  // ═════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════

  return (
    <div className="flex flex-col h-full">
      {/* ─── Header ──────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-8 py-5 border-b border-border">
        <Button variant="outline" size="sm" onClick={onBack}>
          <FiArrowLeft /> {t('toolManagementStorage.easyMode.back')}
        </Button>
        <h2 className="text-xl font-bold text-foreground text-center flex-1">
          {t('toolManagementStorage.easyMode.title')}
        </h2>
        {/* Mode toggle */}
        <div className="flex items-center bg-muted rounded-lg p-0.5">
          <button className="px-4 py-1.5 text-sm font-medium rounded-md bg-background text-foreground shadow-sm">
            {t('toolManagementStorage.upload.mode.easy')}
          </button>
          <button
            className="px-4 py-1.5 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground transition-colors"
            onClick={handleSwitchToDevMode}
          >
            {t('toolManagementStorage.upload.mode.developer')}
          </button>
        </div>
      </div>

      {/* ─── Content ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-8 space-y-8">

          {/* ─── URL Input Section ───────────────────────── */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">{t('toolManagementStorage.easyMode.urlLabel')}</Label>
            <p className="text-sm text-muted-foreground">{t('toolManagementStorage.easyMode.urlHint')}</p>
            <div className="flex gap-3">
              <Input
                className="flex-1"
                value={urlInput}
                onChange={(e) => { setUrlInput(e.target.value); setDiscoveryError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !discovering) handleDiscover(); }}
                placeholder="https://example.com"
                disabled={discovering}
              />
              <Button onClick={handleDiscover} disabled={discovering || !urlInput.trim()}>
                {discovering ? <FiRefreshCw className="animate-spin" /> : <FiSearch />}
                {discovering ? t('toolManagementStorage.easyMode.discovering') : t('toolManagementStorage.easyMode.discover')}
              </Button>
            </div>
            {discoveryError && (
              <div className="flex items-center gap-2 text-sm text-error">
                <FiAlertCircle /> <span>{discoveryError}</span>
              </div>
            )}
          </div>

          {/* ─── Discovery Results ───────────────────────── */}
          {discoveryResult && discoveryResult.endpoints.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-semibold text-foreground">
                    {t('toolManagementStorage.easyMode.endpointsFound', { count: discoveryResult.total_found })}
                  </span>
                  <span className="text-muted-foreground">|</span>
                  <span className="text-muted-foreground">{discoveryResult.page_title}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {t('toolManagementStorage.easyMode.scriptsAnalyzed', { count: discoveryResult.scripts_analyzed })}
                </span>
              </div>

              <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
                {discoveryResult.endpoints.map((ep, idx) => {
                  const isSelected = selectedEndpoint?.url === ep.url && selectedEndpoint?.method === ep.method;
                  return (
                    <div
                      key={`${ep.method}-${ep.url}-${idx}`}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors ${isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/50'}`}
                    >
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border ${getMethodColor(ep.method)}`}>
                        {ep.method}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground uppercase">
                        {ep.type}
                      </span>
                      <span className="flex-1 font-mono text-sm text-foreground truncate" title={ep.full_url}>
                        {ep.url}
                      </span>
                      <span className="text-xs text-muted-foreground">{ep.source}</span>
                      {ep.query_params && Object.keys(ep.query_params).length > 0 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 border border-amber-200" title={Object.keys(ep.query_params).join(', ')}>
                          ?{Object.keys(ep.query_params).length}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Button variant="ghost" size="sm" onClick={() => handleTestEndpoint(ep)} disabled={testingUrl === ep.url} title="Test">
                          {testingUrl === ep.url ? <FiRefreshCw className="animate-spin" /> : <FiPlay />}
                        </Button>
                        <Button variant={isSelected ? 'primary' : 'outline'} size="sm" onClick={() => handleSelectEndpoint(ep)}>
                          {isSelected && <FiCheck />}
                          {t('toolManagementStorage.easyMode.select')}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── Test Result Panel ───────────────────────── */}
          {testResult && (
            <div className={`rounded-lg border overflow-hidden ${testResult.success ? 'border-emerald-300 bg-emerald-50/50' : 'border-red-300 bg-red-50/50'}`}>
              <button
                type="button"
                className="flex items-center justify-between w-full px-4 py-3 text-sm"
                onClick={() => setShowTestResponse(!showTestResponse)}
              >
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${getMethodColor(testResult.endpoint.method)}`}>
                    {testResult.endpoint.method}
                  </span>
                  <span className="font-mono text-xs">{testResult.endpoint.url}</span>
                </div>
                <div className="flex items-center gap-2">
                  {testResult.success
                    ? <span className="text-emerald-700 font-medium">{testResult.data?.status} {testResult.data?.statusText}</span>
                    : <span className="text-red-600 font-medium">{testResult.error || 'Failed'}</span>
                  }
                  {showTestResponse ? <FiChevronUp /> : <FiChevronDown />}
                </div>
              </button>
              {showTestResponse && (
                <pre className="px-4 py-3 text-xs font-mono bg-gray-900 text-gray-100 max-h-[250px] overflow-auto whitespace-pre-wrap break-all">
                  {testResult.error
                    ? testResult.error
                    : typeof testResult.data?.response === 'string'
                      ? testResult.data.response.slice(0, 2000)
                      : JSON.stringify(testResult.data?.response, null, 2)?.slice(0, 2000) || 'No response body'}
                </pre>
              )}
            </div>
          )}

          {/* ─── Step Wizard ─────────────────────────────── */}
          {selectedEndpoint && (
            <div className="space-y-6">
              {/* Selected endpoint info */}
              <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-lg border border-border">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border ${getMethodColor(selectedEndpoint.method)}`}>
                  {selectedEndpoint.method}
                </span>
                <code className="text-sm font-mono text-foreground">{selectedEndpoint.full_url}</code>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center justify-between px-4">
                {STEPS.map((step, idx) => (
                  <React.Fragment key={step}>
                    <div className="flex flex-col items-center gap-1.5">
                      <button
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                          idx < currentStepIndex
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : idx === currentStepIndex
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'bg-background border-border text-muted-foreground'
                        }`}
                        onClick={() => { if (idx <= currentStepIndex || canGoNext()) setCurrentStep(STEPS[idx]); }}
                      >
                        {idx < currentStepIndex ? <FiCheck /> : idx + 1}
                      </button>
                      <span className={`text-xs font-medium ${idx === currentStepIndex ? 'text-primary' : 'text-muted-foreground'}`}>
                        {t(`toolManagementStorage.easyMode.step.${step}`)}
                      </span>
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 rounded ${idx < currentStepIndex ? 'bg-emerald-500' : 'bg-border'}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Step Content */}
              <div className="border border-border rounded-xl bg-background p-8">
                {/* STEP 1: Basic */}
                {currentStep === 'basic' && (
                  <div className="max-w-xl space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{t('toolManagementStorage.easyMode.step.basicTitle')}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{t('toolManagementStorage.easyMode.step.basicHint')}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('toolManagementStorage.easyMode.field.name')} <span className="text-error">*</span></Label>
                      <Input value={toolName} onChange={(e) => handleToolNameChange(e.target.value)} placeholder={t('toolManagementStorage.easyMode.field.namePlaceholder')} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('toolManagementStorage.easyMode.field.id')} <span className="text-error">*</span></Label>
                      <Input value={toolId} onChange={(e) => { setToolId(e.target.value); setIdManuallyEdited(true); }} placeholder={t('toolManagementStorage.easyMode.field.idPlaceholder')} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('toolManagementStorage.easyMode.field.description')} <span className="text-error">*</span></Label>
                      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                        <FiAlertCircle className="mt-0.5 shrink-0" />
                        <span>{t('toolManagementStorage.easyMode.descriptionWarning')}</span>
                      </div>
                      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('toolManagementStorage.easyMode.field.descriptionPlaceholder')} rows={4} />
                    </div>
                  </div>
                )}

                {/* STEP 2: Headers */}
                {currentStep === 'headers' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{t('toolManagementStorage.easyMode.step.headersTitle')}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{t('toolManagementStorage.easyMode.step.headersHint')}</p>
                    </div>
                    {renderKVRows(headers, updateHeader, removeHeader, 'Content-Type', 'application/json')}
                    <Button variant="outline" size="sm" onClick={addHeader}><FiPlus /> {t('toolManagementStorage.easyMode.addHeader')}</Button>
                    {headers.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">{t('toolManagementStorage.easyMode.step.headersEmpty')}</p>
                    )}
                  </div>
                )}

                {/* STEP 3: Params */}
                {currentStep === 'params' && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{t('toolManagementStorage.easyMode.step.paramsTitle')}</h3>
                    </div>
                    {/* Query String toggle */}
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                      <div>
                        <Label>{t('toolManagementStorage.easyMode.step.queryStringLabel')}</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t('toolManagementStorage.easyMode.step.queryStringHint')}</p>
                      </div>
                      <Switch checked={isQueryString} onCheckedChange={setIsQueryString} />
                    </div>
                    {/* Static Params */}
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">{t('toolManagementStorage.easyMode.step.staticTitle')}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{t('toolManagementStorage.easyMode.step.staticHint')}</p>
                      </div>
                      {renderKVRows(staticParams, updateStaticParam, removeStaticParam, 'key', 'value')}
                      <Button variant="outline" size="sm" onClick={addStaticParam}><FiPlus /> {t('toolManagementStorage.easyMode.addParam')}</Button>
                    </div>
                    {/* Dynamic Params */}
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">{t('toolManagementStorage.easyMode.step.dynamicTitle')}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{t('toolManagementStorage.easyMode.step.dynamicHint')}</p>
                      </div>
                      <div className="space-y-2">
                        {dynamicParams.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Input className="flex-1" value={item.key} onChange={(e) => updateDynamicParam(idx, 'key', e.target.value)} placeholder={t('toolManagementStorage.easyMode.step.dynamicKeyPlaceholder')} />
                            <Input className="flex-1" value={item.description} onChange={(e) => updateDynamicParam(idx, 'description', e.target.value)} placeholder={t('toolManagementStorage.easyMode.step.dynamicDescPlaceholder')} />
                            <Button variant="ghost" size="sm" onClick={() => removeDynamicParam(idx)}><FiTrash2 /></Button>
                          </div>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" onClick={addDynamicParam}><FiPlus /> {t('toolManagementStorage.easyMode.addParam')}</Button>
                    </div>
                    {staticParams.length === 0 && dynamicParams.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">{t('toolManagementStorage.easyMode.step.paramsEmpty')}</p>
                    )}
                  </div>
                )}

                {/* STEP 4: Review */}
                {currentStep === 'review' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-foreground">{t('toolManagementStorage.easyMode.step.reviewTitle')}</h3>
                    <div className="border border-border rounded-lg divide-y divide-border">
                      <div className="grid grid-cols-[160px_1fr] px-4 py-3">
                        <span className="text-sm font-medium text-muted-foreground">{t('toolManagementStorage.easyMode.field.name')}</span>
                        <span className="text-sm text-foreground">{toolName}</span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] px-4 py-3">
                        <span className="text-sm font-medium text-muted-foreground">{t('toolManagementStorage.easyMode.field.id')}</span>
                        <code className="text-sm font-mono text-foreground">{toolId}</code>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] px-4 py-3">
                        <span className="text-sm font-medium text-muted-foreground">{t('toolManagementStorage.easyMode.field.description')}</span>
                        <span className="text-sm text-foreground">{description}</span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] px-4 py-3">
                        <span className="text-sm font-medium text-muted-foreground">URL</span>
                        <code className="text-sm font-mono text-foreground break-all">{selectedEndpoint.full_url}</code>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] px-4 py-3">
                        <span className="text-sm font-medium text-muted-foreground">Method</span>
                        <span className={`inline-flex items-center w-fit px-2.5 py-0.5 rounded-md text-xs font-bold border ${getMethodColor(selectedEndpoint.method)}`}>
                          {selectedEndpoint.method}
                        </span>
                      </div>
                      <div className="grid grid-cols-[160px_1fr] px-4 py-3">
                        <span className="text-sm font-medium text-muted-foreground">Query String</span>
                        <span className="text-sm text-foreground">{isQueryString ? 'On' : 'Off'}</span>
                      </div>
                      {headers.filter((h) => h.key.trim()).length > 0 && (
                        <div className="grid grid-cols-[160px_1fr] px-4 py-3">
                          <span className="text-sm font-medium text-muted-foreground">{t('toolManagementStorage.easyMode.step.headers')}</span>
                          <div className="flex flex-wrap gap-1.5">
                            {headers.filter((h) => h.key.trim()).map((h, i) => (
                              <code key={i} className="text-xs bg-muted px-2 py-0.5 rounded">{h.key}: {h.value}</code>
                            ))}
                          </div>
                        </div>
                      )}
                      {staticParams.filter((p) => p.key.trim()).length > 0 && (
                        <div className="grid grid-cols-[160px_1fr] px-4 py-3">
                          <span className="text-sm font-medium text-muted-foreground">{t('toolManagementStorage.easyMode.step.staticTitle')}</span>
                          <div className="flex flex-wrap gap-1.5">
                            {staticParams.filter((p) => p.key.trim()).map((p, i) => (
                              <code key={i} className="text-xs bg-muted px-2 py-0.5 rounded">{p.key} = {p.value}</code>
                            ))}
                          </div>
                        </div>
                      )}
                      {dynamicParams.filter((p) => p.key.trim()).length > 0 && (
                        <div className="grid grid-cols-[160px_1fr] px-4 py-3">
                          <span className="text-sm font-medium text-muted-foreground">{t('toolManagementStorage.easyMode.step.dynamicTitle')}</span>
                          <div className="flex flex-wrap gap-1.5">
                            {dynamicParams.filter((p) => p.key.trim()).map((p, i) => (
                              <code key={i} className="text-xs bg-muted px-2 py-0.5 rounded">{p.key}{p.description ? ` — ${p.description}` : ''}</code>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Step Navigation */}
              <div className="flex items-center justify-between pt-2">
                {currentStepIndex > 0 ? (
                  <Button variant="outline" onClick={goPrev}><FiArrowLeft /> {t('toolManagementStorage.easyMode.prev')}</Button>
                ) : <div />}
                {currentStep !== 'review' ? (
                  <Button onClick={goNext} disabled={!canGoNext()}>
                    {t('toolManagementStorage.easyMode.next')} <FiArrowRight />
                  </Button>
                ) : (
                  <Button onClick={handleSave} disabled={saving || !toolName.trim() || !toolId.trim() || !description.trim()}>
                    <FiSave />
                    {saving ? t('toolManagementStorage.easyMode.saving') : t('toolManagementStorage.easyMode.save')}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToolEasyMode;
