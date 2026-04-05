'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button, Input, Label, Textarea, Switch, Select, SelectTrigger, SelectContent, SelectItem, SelectValue, StatusBadge, useToast } from '@xgen/ui';
import { FiArrowLeft, FiSave, FiPlay, FiPlus, FiTrash2, FiSettings, FiLink, FiMoreVertical } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { saveTool, updateTool, testApiEndpoint } from './api';
import type { ToolDetail, ToolSaveData, ApiTestResult } from './api';
import { ToolEasyMode } from './tool-easy-mode';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface HeaderParam {
  id: string;
  key: string;
  value: string;
}

interface BodyParam {
  id: string;
  key: string;
  type: 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  enumValues: string;
}

interface StaticBodyParam {
  id: string;
  key: string;
  value: string;
}

interface ToolStorageUploadProps {
  onBack: () => void;
  editMode?: boolean;
  initialData?: ToolDetail | null;
  importedData?: ToolSaveData | null;
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;
const BODY_TYPES = [
  'application/json',
  'application/xml',
  'application/x-www-form-urlencoded',
  'multipart/form-data',
  'text/plain',
  'text/html',
  'text/csv',
  'url-params',
] as const;

const PARAM_TYPES = ['string', 'number', 'integer', 'boolean', 'object', 'array'] as const;

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function parseHeaders(raw: unknown): HeaderParam[] {
  try {
    const headers = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!headers || typeof headers !== 'object') return [];
    return Object.entries(headers)
      .filter(([key]) => key.toLowerCase() !== 'content-type')
      .map(([key, value], i) => ({
        id: `h_${Date.now()}_${i}`,
        key,
        value: String(value),
      }));
  } catch {
    return [];
  }
}

function parseBodyParams(raw: unknown): BodyParam[] {
  try {
    const body = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!body || typeof body !== 'object') return [];
    const properties = (body as Record<string, unknown>).properties || body;
    const requiredFields = ((body as Record<string, unknown>).required as string[]) || [];
    return Object.entries(properties as Record<string, Record<string, unknown>>).map(([key, value], i) => ({
      id: `b_${Date.now()}_${i}`,
      key,
      type: (value.type as BodyParam['type']) || 'string',
      description: (value.description as string) || '',
      required: requiredFields.includes(key),
      enumValues: value.enum
        ? Array.isArray(value.enum)
          ? value.enum.join(', ')
          : String(value.enum)
        : '',
    }));
  } catch {
    return [];
  }
}

function parseStaticBody(raw: unknown): StaticBodyParam[] {
  try {
    const sb = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!sb || typeof sb !== 'object') return [];
    return Object.entries(sb as Record<string, unknown>).map(([key, value], i) => ({
      id: `s_${Date.now()}_${i}`,
      key,
      value: String(value),
    }));
  } catch {
    return [];
  }
}

function buildApiBody(params: BodyParam[]): unknown {
  if (params.length === 0) return {};
  const properties: Record<string, Record<string, unknown>> = {};
  const required: string[] = [];
  for (const p of params) {
    if (!p.key.trim()) continue;
    const prop: Record<string, unknown> = { type: p.type, description: p.description };
    if (p.enumValues.trim()) {
      prop.enum = p.enumValues.split(',').map((v) => v.trim()).filter(Boolean);
    }
    properties[p.key] = prop;
    if (p.required) required.push(p.key);
  }
  return { type: 'object', properties, required };
}

function buildStaticBody(params: StaticBodyParam[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const p of params) {
    if (p.key.trim()) result[p.key] = p.value;
  }
  return result;
}

function buildHeaders(params: HeaderParam[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const p of params) {
    if (p.key.trim()) result[p.key] = p.value;
  }
  return result;
}

// ─────────────────────────────────────────────────────────────
// Two-column field row layout
// ─────────────────────────────────────────────────────────────

interface FieldRowProps {
  label: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
}

const FieldRow: React.FC<FieldRowProps> = ({ label, description, required, children }) => (
  <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 md:gap-8 items-start py-6 border-b border-border last:border-b-0">
    <div className="space-y-1">
      <div className="text-sm font-semibold text-foreground">
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </div>
      {description && <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>}
    </div>
    <div className="min-w-0">
      {children}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export const ToolStorageUpload: React.FC<ToolStorageUploadProps> = ({
  onBack,
  editMode = false,
  initialData = null,
  importedData = null,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  // Mode toggle: Easy / Developer (only in create mode)
  const [creationMode, setCreationMode] = useState<'easy' | 'developer'>(
    editMode || importedData ? 'developer' : 'easy',
  );

  // Shorthand for initial values
  const ini = initialData;
  const imp = importedData;

  const [activeTab, setActiveTab] = useState<'basic' | 'api' | 'additional'>('basic');
  const [saving, setSaving] = useState(false);

  // Basic tab
  const [functionName, setFunctionName] = useState(imp?.function_name || ini?.name || '');
  const [functionId, setFunctionId] = useState(imp?.function_id || ini?.id || '');
  const [description, setDescription] = useState(imp?.description || ini?.description || '');

  // API tab
  const [apiUrl, setApiUrl] = useState(imp?.api_url || ini?.apiUrl || '');
  const [apiMethod, setApiMethod] = useState(imp?.api_method || ini?.apiMethod || 'GET');
  const [apiTimeout, setApiTimeout] = useState(String(imp?.api_timeout || ini?.apiTimeout || 30));
  const [bodyType, setBodyType] = useState(imp?.body_type || ini?.bodyType || 'application/json');
  const [isQueryString, setIsQueryString] = useState(imp?.is_query_string || ini?.isQueryString || false);
  const [headerParams, setHeaderParams] = useState<HeaderParam[]>(
    parseHeaders(imp?.api_header || ini?.apiHeader),
  );
  const [bodyParams, setBodyParams] = useState<BodyParam[]>(
    parseBodyParams(imp?.api_body || ini?.apiBody),
  );
  const [staticBodyParams, setStaticBodyParams] = useState<StaticBodyParam[]>(
    parseStaticBody(imp?.static_body || ini?.staticBody),
  );

  // API Test
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ApiTestResult | null>(null);

  // Additional tab
  const [responseFilter, setResponseFilter] = useState(imp?.response_filter || ini?.responseFilter || false);
  const [responseFilterPath, setResponseFilterPath] = useState(imp?.response_filter_path || ini?.responseFilterPath || '');
  const [responseFilterField, setResponseFilterField] = useState(imp?.response_filter_field || ini?.responseFilterField || '');
  const [htmlParser, setHtmlParser] = useState(imp?.html_parser || ini?.htmlParser || false);
  const [metadata, setMetadata] = useState(() => {
    const m = imp?.metadata || ini?.metadata;
    if (!m) return '{}';
    if (typeof m === 'string') return m;
    return JSON.stringify(m, null, 2);
  });

  // Auto-generate function_id from name
  useEffect(() => {
    if (!editMode && !imp && functionName && !functionId) {
      setFunctionId(functionName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''));
    }
  }, [functionName, functionId, editMode, imp]);

  // Header management
  const addHeader = () => setHeaderParams([...headerParams, { id: `h_${Date.now()}`, key: '', value: '' }]);
  const updateHeader = (id: string, field: 'key' | 'value', value: string) =>
    setHeaderParams((p) => p.map((h) => (h.id === id ? { ...h, [field]: value } : h)));
  const removeHeader = (id: string) => setHeaderParams((p) => p.filter((h) => h.id !== id));

  // Body param management
  const addBodyParam = () =>
    setBodyParams([...bodyParams, { id: `b_${Date.now()}`, key: '', type: 'string', description: '', required: false, enumValues: '' }]);
  const updateBodyParam = (id: string, field: keyof BodyParam, value: unknown) =>
    setBodyParams((p) => p.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  const removeBodyParam = (id: string) => setBodyParams((p) => p.filter((b) => b.id !== id));

  // Static body management
  const addStaticBody = () => setStaticBodyParams([...staticBodyParams, { id: `s_${Date.now()}`, key: '', value: '' }]);
  const updateStaticBody = (id: string, field: 'key' | 'value', value: string) =>
    setStaticBodyParams((p) => p.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  const removeStaticBody = (id: string) => setStaticBodyParams((p) => p.filter((s) => s.id !== id));

  // Build save data
  const buildToolData = useCallback((): ToolSaveData => {
    let parsedMetadata: Record<string, unknown> = {};
    try {
      parsedMetadata = JSON.parse(metadata);
    } catch {
      parsedMetadata = {};
    }

    return {
      function_name: functionName,
      function_id: functionId,
      description,
      api_url: apiUrl,
      api_method: apiMethod,
      api_timeout: Number(apiTimeout) || 30,
      body_type: bodyType,
      is_query_string: isQueryString,
      response_filter: responseFilter,
      html_parser: htmlParser,
      response_filter_path: responseFilterPath,
      response_filter_field: responseFilterField,
      api_header: buildHeaders(headerParams),
      api_body: buildApiBody(bodyParams),
      static_body: buildStaticBody(staticBodyParams),
      metadata: parsedMetadata,
      status: ini?.status || 'active',
    };
  }, [functionName, functionId, description, apiUrl, apiMethod, apiTimeout, bodyType, isQueryString, responseFilter, htmlParser, responseFilterPath, responseFilterField, headerParams, bodyParams, staticBodyParams, metadata, ini?.status]);

  // Test API
  const handleTestApi = useCallback(async () => {
    if (!apiUrl.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testApiEndpoint({
        api_url: apiUrl,
        api_method: apiMethod,
        api_headers: buildHeaders(headerParams),
        api_body: buildApiBody(bodyParams),
        static_body: buildStaticBody(staticBodyParams),
        body_type: bodyType,
        is_query_string: isQueryString,
        html_parser: htmlParser,
        api_timeout: Number(apiTimeout) || 30,
      });
      setTestResult(result);
    } catch (err) {
      setTestResult({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setTesting(false);
    }
  }, [apiUrl, apiMethod, headerParams, bodyParams, staticBodyParams, bodyType, isQueryString, htmlParser, apiTimeout]);

  // Save
  const handleSave = useCallback(async () => {
    if (!functionName.trim() || !functionId.trim() || !apiUrl.trim()) {
      toast.error(t('toolManagementStorage.upload.error.requiredFields'));
      return;
    }
    setSaving(true);
    try {
      const toolData = buildToolData();
      if (editMode && initialData) {
        await updateTool(initialData.keyValue, functionId, toolData);
      } else {
        await saveTool(functionName, toolData);
      }
      toast.success(t('toolManagementStorage.upload.saveSuccess'));
      onBack();
    } catch (err) {
      toast.error(t('toolManagementStorage.upload.saveFailed'));
    } finally {
      setSaving(false);
    }
  }, [functionName, functionId, apiUrl, buildToolData, editMode, initialData, onBack, toast, t]);

  // Easy Mode → Dev Mode switch with prefill
  const handleSwitchToDevMode = useCallback((prefillData?: Partial<ToolSaveData>) => {
    setCreationMode('developer');
    if (prefillData) {
      if (prefillData.function_name) setFunctionName(prefillData.function_name);
      if (prefillData.function_id) setFunctionId(prefillData.function_id);
      if (prefillData.description) setDescription(prefillData.description);
      if (prefillData.api_url) setApiUrl(prefillData.api_url);
      if (prefillData.api_method) setApiMethod(prefillData.api_method);
    }
  }, []);

  const isValid = functionName.trim() && functionId.trim() && apiUrl.trim();

  // Tab config with icons
  const tabs = [
    { key: 'basic' as const, label: t('toolManagementStorage.upload.tabs.basic'), icon: FiSettings },
    { key: 'api' as const, label: t('toolManagementStorage.upload.tabs.api'), icon: FiLink },
    { key: 'additional' as const, label: t('toolManagementStorage.upload.tabs.additional'), icon: FiMoreVertical },
  ];

  // ─── Easy Mode in create mode ─────────────────────────────
  if (!editMode && creationMode === 'easy') {
    return (
      <ToolEasyMode
        onBack={onBack}
        onSwitchToDevMode={handleSwitchToDevMode}
      />
    );
  }

  // ═════════════════════════════════════════════════════════════
  // Developer Mode (Edit / Create)
  // ═════════════════════════════════════════════════════════════

  return (
    <div className="flex flex-col h-full">
      {/* ─── Header ────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-8 py-5 border-b border-border">
        <Button variant="outline" size="sm" onClick={onBack}>
          <FiArrowLeft /> {t('toolManagementStorage.upload.goBack')}
        </Button>

        <div className="flex-1 flex items-center justify-center gap-3">
          <h2 className="text-xl font-bold text-foreground">
            {editMode ? t('toolManagementStorage.upload.titleEdit') : t('toolManagementStorage.upload.titleCreate')}
          </h2>
          {editMode && ini && (
            <StatusBadge variant={ini.status === 'active' ? 'success' : 'neutral'}>
              {ini.status === 'active' ? 'Active' : 'Inactive'}
            </StatusBadge>
          )}
        </div>

        {/* Mode toggle (create only) */}
        {!editMode && (
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            <button
              className="px-4 py-1.5 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setCreationMode('easy')}
            >
              {t('toolManagementStorage.upload.mode.easy')}
            </button>
            <button className="px-4 py-1.5 text-sm font-medium rounded-md bg-background text-foreground shadow-sm">
              {t('toolManagementStorage.upload.mode.developer')}
            </button>
          </div>
        )}

        <Button onClick={handleSave} disabled={saving || !isValid}>
          <FiSave />
          {saving ? t('toolManagementStorage.upload.saving') : t('toolManagementStorage.upload.save')}
        </Button>
      </div>

      {/* ─── Tab Bar ───────────────────────────────────── */}
      <div className="flex border-b border-border bg-muted/20">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-colors border-b-2 ${
                isActive
                  ? 'border-primary text-primary bg-background'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── Tab Content ───────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">

          {/* ═══ BASIC TAB ═══════════════════════════════ */}
          {activeTab === 'basic' && (
            <div className="space-y-0">
              <FieldRow
                label={t('toolManagementStorage.upload.fields.functionName')}
                description={t('toolManagementStorage.upload.descriptions.functionName')}
                required
              >
                <Input
                  value={functionName}
                  onChange={(e) => setFunctionName(e.target.value)}
                  placeholder={t('toolManagementStorage.upload.placeholders.functionName')}
                />
              </FieldRow>

              <FieldRow
                label={t('toolManagementStorage.upload.fields.functionId')}
                description={t('toolManagementStorage.upload.descriptions.functionId')}
                required
              >
                <Input
                  value={functionId}
                  onChange={(e) => setFunctionId(e.target.value)}
                  placeholder={t('toolManagementStorage.upload.placeholders.functionId')}
                  disabled={editMode}
                  className={editMode ? 'bg-muted cursor-not-allowed' : ''}
                />
              </FieldRow>

              {editMode && ini && (
                <FieldRow
                  label={t('toolManagementStorage.upload.fields.status')}
                  description={t('toolManagementStorage.upload.descriptions.status')}
                >
                  <StatusBadge variant={ini.status === 'active' ? 'success' : 'neutral'}>
                    {ini.status === 'active' ? 'Active' : 'Inactive'}
                  </StatusBadge>
                </FieldRow>
              )}

              <FieldRow
                label={t('toolManagementStorage.upload.fields.description')}
                description={t('toolManagementStorage.upload.descriptions.description')}
              >
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('toolManagementStorage.upload.placeholders.description')}
                  rows={4}
                />
              </FieldRow>
            </div>
          )}

          {/* ═══ API TAB ═════════════════════════════════ */}
          {activeTab === 'api' && (
            <div className="space-y-0">
              <FieldRow
                label={t('toolManagementStorage.upload.fields.apiUrl')}
                description={t('toolManagementStorage.upload.descriptions.apiUrl')}
                required
              >
                <Input
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://api.example.com/v1/endpoint"
                />
              </FieldRow>

              <FieldRow
                label={t('toolManagementStorage.upload.fields.method')}
                description={t('toolManagementStorage.upload.descriptions.method')}
              >
                <Select value={apiMethod} onValueChange={setApiMethod}>
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HTTP_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>

              <FieldRow
                label={t('toolManagementStorage.upload.fields.timeout')}
                description={t('toolManagementStorage.upload.descriptions.timeout')}
              >
                <Input
                  type="number"
                  min={1}
                  max={300}
                  value={apiTimeout}
                  onChange={(e) => setApiTimeout(e.target.value)}
                  className="w-[180px]"
                />
              </FieldRow>

              <FieldRow
                label={t('toolManagementStorage.upload.fields.bodyType')}
                description={t('toolManagementStorage.upload.descriptions.bodyType')}
              >
                <Select value={bodyType} onValueChange={setBodyType}>
                  <SelectTrigger className="w-[280px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BODY_TYPES.map((bt) => (
                      <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>

              <FieldRow
                label={t('toolManagementStorage.upload.fields.queryString')}
                description={t('toolManagementStorage.upload.hints.queryString')}
              >
                <Switch checked={isQueryString} onCheckedChange={setIsQueryString} />
              </FieldRow>

              {/* Headers */}
              <FieldRow
                label={t('toolManagementStorage.upload.fields.headers')}
                description={t('toolManagementStorage.upload.descriptions.headers')}
              >
                <div className="space-y-2">
                  {headerParams.map((h) => (
                    <div key={h.id} className="grid grid-cols-[1fr_1fr_36px] gap-2 items-center">
                      <Input value={h.key} onChange={(e) => updateHeader(h.id, 'key', e.target.value)} placeholder="Key" />
                      <Input value={h.value} onChange={(e) => updateHeader(h.id, 'value', e.target.value)} placeholder="Value" />
                      <Button variant="ghost" size="sm" onClick={() => removeHeader(h.id)}><FiTrash2 /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addHeader}>
                    <FiPlus /> {t('toolManagementStorage.upload.buttons.addHeader')}
                  </Button>
                </div>
              </FieldRow>

              {/* Body Params */}
              <FieldRow
                label={t('toolManagementStorage.upload.fields.bodyParams')}
                description={t('toolManagementStorage.upload.descriptions.bodyParams')}
              >
                <div className="space-y-3">
                  {bodyParams.map((bp) => (
                    <div key={bp.id} className="p-4 border border-border rounded-lg space-y-3 bg-muted/20">
                      <div className="grid grid-cols-[1fr_120px_36px] gap-2 items-center">
                        <Input value={bp.key} onChange={(e) => updateBodyParam(bp.id, 'key', e.target.value)} placeholder="Parameter name" />
                        <Select value={bp.type} onValueChange={(v) => updateBodyParam(bp.id, 'type', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {PARAM_TYPES.map((pt) => (
                              <SelectItem key={pt} value={pt}>{pt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="sm" onClick={() => removeBodyParam(bp.id)}><FiTrash2 /></Button>
                      </div>
                      <Input
                        value={bp.description}
                        onChange={(e) => updateBodyParam(bp.id, 'description', e.target.value)}
                        placeholder={t('toolManagementStorage.upload.placeholders.paramDesc')}
                      />
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={bp.required}
                            onChange={(e) => updateBodyParam(bp.id, 'required', e.target.checked)}
                            className="rounded"
                          />
                          {t('toolManagementStorage.upload.fields.required')}
                        </label>
                        <Input
                          value={bp.enumValues}
                          onChange={(e) => updateBodyParam(bp.id, 'enumValues', e.target.value)}
                          placeholder={t('toolManagementStorage.upload.placeholders.enumValues')}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addBodyParam}>
                    <FiPlus /> {t('toolManagementStorage.upload.buttons.addParam')}
                  </Button>
                </div>
              </FieldRow>

              {/* Static Body */}
              <FieldRow
                label={t('toolManagementStorage.upload.fields.staticBody')}
                description={t('toolManagementStorage.upload.descriptions.staticBody')}
              >
                <div className="space-y-2">
                  {staticBodyParams.map((sb) => (
                    <div key={sb.id} className="grid grid-cols-[1fr_1fr_36px] gap-2 items-center">
                      <Input value={sb.key} onChange={(e) => updateStaticBody(sb.id, 'key', e.target.value)} placeholder="Key" />
                      <Input value={sb.value} onChange={(e) => updateStaticBody(sb.id, 'value', e.target.value)} placeholder="Value" />
                      <Button variant="ghost" size="sm" onClick={() => removeStaticBody(sb.id)}><FiTrash2 /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addStaticBody}>
                    <FiPlus /> {t('toolManagementStorage.upload.buttons.addStatic')}
                  </Button>
                </div>
              </FieldRow>

              {/* Test API */}
              <FieldRow
                label={t('toolManagementStorage.upload.buttons.testApi')}
                description={t('toolManagementStorage.upload.descriptions.testApi')}
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={handleTestApi} disabled={testing || !apiUrl.trim()}>
                      <FiPlay />
                      {testing ? t('toolManagementStorage.upload.buttons.testing') : t('toolManagementStorage.upload.buttons.testApi')}
                    </Button>
                    {testResult && (
                      <span className={`text-sm font-medium ${testResult.success ? 'text-emerald-600' : 'text-red-500'}`}>
                        {testResult.success ? '✓ Success' : `✗ ${testResult.error || 'Failed'}`}
                      </span>
                    )}
                  </div>
                  {testResult?.data && (
                    <div className="rounded-lg overflow-hidden border border-border">
                      <div className="px-4 py-2 bg-muted/50 text-xs text-muted-foreground border-b border-border">
                        Status: {testResult.data.status} {testResult.data.statusText}
                      </div>
                      <pre className="px-4 py-3 text-xs font-mono text-foreground whitespace-pre-wrap break-all max-h-[300px] overflow-auto bg-gray-900 text-gray-100">
                        {typeof testResult.data.response === 'string'
                          ? testResult.data.response
                          : JSON.stringify(testResult.data.response, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </FieldRow>
            </div>
          )}

          {/* ═══ ADDITIONAL TAB ═══════════════════════════ */}
          {activeTab === 'additional' && (
            <div className="space-y-0">
              <FieldRow
                label={t('toolManagementStorage.upload.fields.responseFilter')}
                description={t('toolManagementStorage.upload.hints.responseFilter')}
              >
                <div className="space-y-4">
                  <Switch checked={responseFilter} onCheckedChange={setResponseFilter} />
                  {responseFilter && (
                    <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                      <div className="space-y-2">
                        <Label className="text-xs">{t('toolManagementStorage.upload.fields.filterPath')}</Label>
                        <Input value={responseFilterPath} onChange={(e) => setResponseFilterPath(e.target.value)} placeholder="data.results" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">{t('toolManagementStorage.upload.fields.filterField')}</Label>
                        <Input value={responseFilterField} onChange={(e) => setResponseFilterField(e.target.value)} placeholder="name, description" />
                      </div>
                    </div>
                  )}
                </div>
              </FieldRow>

              <FieldRow
                label={t('toolManagementStorage.upload.fields.htmlParser')}
                description={t('toolManagementStorage.upload.hints.htmlParser')}
              >
                <Switch checked={htmlParser} onCheckedChange={setHtmlParser} />
              </FieldRow>

              <FieldRow
                label={t('toolManagementStorage.upload.fields.metadata')}
                description={t('toolManagementStorage.upload.hints.metadata')}
              >
                <Textarea
                  value={metadata}
                  onChange={(e) => setMetadata(e.target.value)}
                  placeholder="{}"
                  rows={6}
                  className="font-mono text-sm"
                />
              </FieldRow>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToolStorageUpload;
