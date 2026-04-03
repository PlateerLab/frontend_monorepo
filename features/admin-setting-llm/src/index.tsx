'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { createApiClient } from '@xgen/api-client';
import { BaseConfigPanel, fetchAllConfigs, updateConfig } from '@xgen/admin-setting-shared';
import type { ConfigItem, FieldConfig } from '@xgen/admin-setting-shared';
import {
  SiOpenai, SiAnthropic, RiGeminiFill, FaAws, BsCpu, TbBrandGolang,
  FiServer, FiSettings, FiCheck, FiAlertCircle, FiRefreshCw,
} from '@xgen/icons';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const SS = 'admin.settings.llm';

type TabId = 'default' | 'openai' | 'gemini' | 'anthropic' | 'aws' | 'vllm' | 'sglang';

interface TabDef {
  id: TabId;
  labelKey: string;
  icon: React.ReactNode;
}

const TABS: TabDef[] = [
  { id: 'default', labelKey: `${SS}.tabs.default`, icon: <FiSettings className="h-4 w-4" /> },
  { id: 'openai', labelKey: `${SS}.tabs.openai`, icon: <SiOpenai className="h-4 w-4" /> },
  { id: 'gemini', labelKey: `${SS}.tabs.gemini`, icon: <RiGeminiFill className="h-4 w-4" /> },
  { id: 'anthropic', labelKey: `${SS}.tabs.anthropic`, icon: <SiAnthropic className="h-4 w-4" /> },
  { id: 'aws', labelKey: `${SS}.tabs.aws`, icon: <FaAws className="h-4 w-4" /> },
  { id: 'vllm', labelKey: `${SS}.tabs.vllm`, icon: <BsCpu className="h-4 w-4" /> },
  { id: 'sglang', labelKey: `${SS}.tabs.sglang`, icon: <FiServer className="h-4 w-4" /> },
];

interface ProviderCard {
  name: string;
  labelKey: string;
  icon: React.ReactNode;
  color: string;
}

const PROVIDER_CARDS: ProviderCard[] = [
  { name: 'openai', labelKey: `${SS}.providers.openai`, icon: <SiOpenai className="h-6 w-6" />, color: '#10a37f' },
  { name: 'gemini', labelKey: `${SS}.providers.gemini`, icon: <RiGeminiFill className="h-6 w-6" />, color: '#4285f4' },
  { name: 'anthropic', labelKey: `${SS}.providers.anthropic`, icon: <SiAnthropic className="h-6 w-6" />, color: '#d4a574' },
  { name: 'aws_bedrock', labelKey: `${SS}.providers.aws`, icon: <FaAws className="h-6 w-6" />, color: '#ff9900' },
  { name: 'vllm', labelKey: `${SS}.providers.vllm`, icon: <BsCpu className="h-6 w-6" />, color: '#6366f1' },
  { name: 'sglang', labelKey: `${SS}.providers.sglang`, icon: <FiServer className="h-6 w-6" />, color: '#0ea5e9' },
];

// ─────────────────────────────────────────────────────────────
// Field definitions
// ─────────────────────────────────────────────────────────────

function buildFieldConfigs(t: (key: string) => string): Record<TabId, { fields: Record<string, FieldConfig>; filterPrefix: string }> {
  return {
    default: {
      filterPrefix: 'DEFAULT_LLM',
      fields: {
        DEFAULT_LLM_PROVIDER: {
          label: t(`${SS}.fields.defaultProvider`),
          type: 'select',
          description: t(`${SS}.fields.defaultProviderDesc`),
          required: true,
          options: [
            { value: 'openai', label: 'OpenAI' },
            { value: 'gemini', label: 'Gemini' },
            { value: 'anthropic', label: 'Anthropic' },
            { value: 'aws_bedrock', label: 'AWS Bedrock' },
            { value: 'vllm', label: 'vLLM' },
            { value: 'sglang', label: 'SGLang' },
          ],
        },
      },
    },
    openai: {
      filterPrefix: 'openai',
      fields: {
        OPENAI_API_KEY: { label: t(`${SS}.fields.apiKey`), type: 'password', description: t(`${SS}.fields.openaiApiKeyDesc`), required: true },
        OPENAI_API_BASE_URL: { label: t(`${SS}.fields.apiBaseUrl`), type: 'text', description: t(`${SS}.fields.openaiBaseUrlDesc`), required: false, placeholder: 'https://api.openai.com/v1' },
        OPENAI_MODEL_DEFAULT: {
          label: t(`${SS}.fields.defaultModel`), type: 'select', description: t(`${SS}.fields.openaiModelDesc`), required: true,
          options: [
            { value: 'gpt-4o-mini-2024-07-18', label: 'GPT-4o Mini (2024-07-18)' },
            { value: 'gpt-4o-2024-11-20', label: 'GPT-4o (2024-11-20)' },
            { value: 'gpt-4.1-mini-2025-04-14', label: 'GPT-4.1 Mini (2025-04-14)' },
            { value: 'gpt-4.1-2025-04-14', label: 'GPT-4.1 (2025-04-14)' },
          ],
        },
        OPENAI_TEMPERATURE_DEFAULT: { label: t(`${SS}.fields.temperature`), type: 'number', description: t(`${SS}.fields.temperatureDesc`), required: false, min: 0, max: 2, step: 0.1 },
        OPENAI_MAX_TOKENS_DEFAULT: { label: t(`${SS}.fields.maxTokens`), type: 'number', description: t(`${SS}.fields.maxTokensDesc`), required: false, min: 1, max: 32000, step: 1 },
      },
    },
    gemini: {
      filterPrefix: 'gemini',
      fields: {
        GEMINI_API_KEY: { label: t(`${SS}.fields.apiKey`), type: 'password', description: t(`${SS}.fields.geminiApiKeyDesc`), required: true },
        GEMINI_API_BASE_URL: { label: t(`${SS}.fields.apiBaseUrl`), type: 'text', description: t(`${SS}.fields.geminiBaseUrlDesc`), required: false },
        GEMINI_MODEL_DEFAULT: {
          label: t(`${SS}.fields.defaultModel`), type: 'select', description: t(`${SS}.fields.geminiModelDesc`), required: true,
          options: [
            { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
            { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
            { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
          ],
        },
        GEMINI_TEMPERATURE_DEFAULT: { label: t(`${SS}.fields.temperature`), type: 'number', description: t(`${SS}.fields.temperatureDesc`), required: false, min: 0, max: 2, step: 0.1 },
        GEMINI_MAX_TOKENS_DEFAULT: { label: t(`${SS}.fields.maxTokens`), type: 'number', description: t(`${SS}.fields.maxTokensDesc`), required: false, min: 1, max: 32000, step: 1 },
      },
    },
    anthropic: {
      filterPrefix: 'anthropic',
      fields: {
        ANTHROPIC_API_KEY: { label: t(`${SS}.fields.apiKey`), type: 'password', description: t(`${SS}.fields.anthropicApiKeyDesc`), required: true },
        ANTHROPIC_API_BASE_URL: { label: t(`${SS}.fields.apiBaseUrl`), type: 'text', description: t(`${SS}.fields.anthropicBaseUrlDesc`), required: false },
        ANTHROPIC_MODEL_DEFAULT: {
          label: t(`${SS}.fields.defaultModel`), type: 'select', description: t(`${SS}.fields.anthropicModelDesc`), required: true,
          options: [
            { value: 'claude-opus-4-20250514', label: 'Claude Opus 4 (2025-05-14)' },
            { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (2025-05-14)' },
            { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (2024-10-22)' },
          ],
        },
        ANTHROPIC_TEMPERATURE_DEFAULT: { label: t(`${SS}.fields.temperature`), type: 'number', description: t(`${SS}.fields.temperatureDesc`), required: false, min: 0, max: 1, step: 0.1 },
        ANTHROPIC_MAX_TOKENS_DEFAULT: { label: t(`${SS}.fields.maxTokens`), type: 'number', description: t(`${SS}.fields.maxTokensDesc`), required: false, min: 1, max: 32000, step: 1 },
      },
    },
    aws: {
      filterPrefix: 'aws',
      fields: {
        AWS_ACCESS_KEY_ID: { label: t(`${SS}.fields.awsAccessKeyId`), type: 'password', description: t(`${SS}.fields.awsAccessKeyIdDesc`), required: true },
        AWS_SECRET_ACCESS_KEY: { label: t(`${SS}.fields.awsSecretAccessKey`), type: 'password', description: t(`${SS}.fields.awsSecretAccessKeyDesc`), required: true },
        AWS_SESSION_TOKEN: { label: t(`${SS}.fields.awsSessionToken`), type: 'password', description: t(`${SS}.fields.awsSessionTokenDesc`), required: false },
        AWS_REGION: {
          label: t(`${SS}.fields.awsRegion`), type: 'select', description: t(`${SS}.fields.awsRegionDesc`), required: true,
          options: [
            { value: 'us-east-1', label: 'US East (N. Virginia)' },
            { value: 'us-west-2', label: 'US West (Oregon)' },
            { value: 'eu-west-1', label: 'EU (Ireland)' },
            { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
            { value: 'ap-northeast-2', label: 'Asia Pacific (Seoul)' },
          ],
        },
        AWS_BEDROCK_ENDPOINT_URL: { label: t(`${SS}.fields.awsEndpointUrl`), type: 'text', description: t(`${SS}.fields.awsEndpointUrlDesc`), required: false },
      },
    },
    vllm: {
      filterPrefix: 'vllm',
      fields: {
        VLLM_API_BASE_URL: { label: t(`${SS}.fields.apiBaseUrl`), type: 'text', description: t(`${SS}.fields.vllmBaseUrlDesc`), required: true },
        VLLM_API_KEY: { label: t(`${SS}.fields.apiKey`), type: 'password', description: t(`${SS}.fields.vllmApiKeyDesc`), required: false },
        VLLM_MODEL_NAME: { label: t(`${SS}.fields.modelName`), type: 'text', description: t(`${SS}.fields.vllmModelNameDesc`), required: true },
        VLLM_TEMPERATURE: { label: t(`${SS}.fields.temperature`), type: 'number', description: t(`${SS}.fields.temperatureDesc`), required: false, min: 0, max: 2, step: 0.1 },
        VLLM_MAX_TOKENS: { label: t(`${SS}.fields.maxTokens`), type: 'number', description: t(`${SS}.fields.maxTokensDesc`), required: false, min: 1, max: 65536, step: 1 },
        VLLM_TOP_P: { label: t(`${SS}.fields.topP`), type: 'number', description: t(`${SS}.fields.topPDesc`), required: false, min: 0, max: 1, step: 0.05 },
        VLLM_STREAM: { label: t(`${SS}.fields.stream`), type: 'boolean', description: t(`${SS}.fields.streamDesc`), required: false },
      },
    },
    sglang: {
      filterPrefix: 'sgl',
      fields: {
        SGL_API_BASE_URL: { label: t(`${SS}.fields.apiBaseUrl`), type: 'text', description: t(`${SS}.fields.sglBaseUrlDesc`), required: true },
        SGL_API_KEY: { label: t(`${SS}.fields.apiKey`), type: 'password', description: t(`${SS}.fields.sglApiKeyDesc`), required: false },
        SGL_MODEL_NAME: { label: t(`${SS}.fields.modelName`), type: 'text', description: t(`${SS}.fields.sglModelNameDesc`), required: true },
        SGL_TEMPERATURE: { label: t(`${SS}.fields.temperature`), type: 'number', description: t(`${SS}.fields.temperatureDesc`), required: false, min: 0, max: 2, step: 0.1 },
        SGL_MAX_TOKENS: { label: t(`${SS}.fields.maxTokens`), type: 'number', description: t(`${SS}.fields.maxTokensDesc`), required: false, min: 1, max: 65536, step: 1 },
        SGL_TOP_P: { label: t(`${SS}.fields.topP`), type: 'number', description: t(`${SS}.fields.topPDesc`), required: false, min: 0, max: 1, step: 0.05 },
      },
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────

const AdminSettingLlmPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<TabId>('default');
  const [configData, setConfigData] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [llmStatus, setLlmStatus] = useState<Record<string, unknown>>({});

  const allFields = useMemo(() => buildFieldConfigs(t), [t]);

  const loadConfigs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAllConfigs();
      const configs = (data as { persistent_summary: { configs: ConfigItem[] } }).persistent_summary?.configs ?? [];
      setConfigData(configs);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLlmStatus = useCallback(async () => {
    try {
      const api = createApiClient();
      const res = await api.get<Record<string, unknown>>('/api/llm/status');
      setLlmStatus(res.data ?? {});
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    loadConfigs();
    loadLlmStatus();
  }, [loadConfigs, loadLlmStatus]);

  const currentDefault = useMemo(() => {
    const item = configData.find((c) => c.env_name === 'DEFAULT_LLM_PROVIDER');
    return item?.current_value as string | undefined;
  }, [configData]);

  const handleSetDefault = async (providerName: string) => {
    try {
      await updateConfig('DEFAULT_LLM_PROVIDER', providerName);
      await loadConfigs();
    } catch {
      // silent
    }
  };

  const tabConfig = allFields[activeTab];

  return (
    <ContentArea>
      <div className="flex flex-col gap-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">{t(`${SS}.title`)}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t(`${SS}.description`)}</p>
          </div>
          <button
            onClick={() => { loadConfigs(); loadLlmStatus(); }}
            className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
          >
            <FiRefreshCw className="h-3.5 w-3.5" />
            {t(`${SS}.refresh`)}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-muted/50 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              {t(tab.labelKey)}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            {t(`${SS}.loading`)}
          </div>
        ) : activeTab === 'default' ? (
          <div className="flex flex-col gap-4">
            <BaseConfigPanel
              configData={configData}
              fieldConfigs={tabConfig.fields}
              filterPrefix={tabConfig.filterPrefix}
              onConfigChange={loadConfigs}
              showTestConnection={false}
            />

            {/* Provider cards */}
            <div>
              <h2 className="mb-3 text-sm font-semibold text-foreground">{t(`${SS}.providerGrid`)}</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {PROVIDER_CARDS.map((provider) => {
                  const isDefault = currentDefault === provider.name;
                  const status = llmStatus[provider.name] as { available?: boolean } | undefined;
                  const isAvailable = status?.available;

                  return (
                    <button
                      key={provider.name}
                      onClick={() => handleSetDefault(provider.name)}
                      className={`group flex items-center gap-3 rounded-lg border p-4 text-left transition-all hover:shadow-sm ${
                        isDefault
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:border-primary/40'
                      }`}
                    >
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                        style={{ color: provider.color, backgroundColor: `${provider.color}15` }}
                      >
                        {provider.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-foreground">{t(provider.labelKey)}</span>
                          {isDefault && (
                            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                              {t(`${SS}.default`)}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          {isAvailable !== undefined && (
                            isAvailable
                              ? <><FiCheck className="h-3 w-3 text-emerald-500" />{t(`${SS}.available`)}</>
                              : <><FiAlertCircle className="h-3 w-3 text-amber-500" />{t(`${SS}.unavailable`)}</>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <BaseConfigPanel
            configData={configData}
            fieldConfigs={tabConfig.fields}
            filterPrefix={tabConfig.filterPrefix}
            onConfigChange={loadConfigs}
          />
        )}
      </div>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Module
// ─────────────────────────────────────────────────────────────

const feature: AdminFeatureModule = {
  id: 'admin-setting-llm',
  name: 'AdminSettingLlm',
  adminSection: 'admin-setting',
  routes: {
    'admin-setting-llm': AdminSettingLlmPage,
  },
};

export default feature;
