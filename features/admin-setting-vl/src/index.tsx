'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { BaseConfigPanel, fetchAllConfigs } from '@xgen/admin-setting-shared';
import type { ConfigItem, FieldConfig } from '@xgen/admin-setting-shared';
import { SiOpenai, SiAnthropic, RiGeminiFill, FaAws, BsCpu, FiSettings, FiRefreshCw } from '@xgen/icons';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const SS = 'admin.settings.vl';

type TabId = 'default' | 'openai' | 'anthropic' | 'gemini' | 'aws' | 'vllm';

interface TabDef {
  id: TabId;
  labelKey: string;
  icon: React.ReactNode;
}

const TABS: TabDef[] = [
  { id: 'default', labelKey: `${SS}.tabs.default`, icon: <FiSettings className="h-4 w-4" /> },
  { id: 'openai', labelKey: `${SS}.tabs.openai`, icon: <SiOpenai className="h-4 w-4" /> },
  { id: 'anthropic', labelKey: `${SS}.tabs.anthropic`, icon: <SiAnthropic className="h-4 w-4" /> },
  { id: 'gemini', labelKey: `${SS}.tabs.gemini`, icon: <RiGeminiFill className="h-4 w-4" /> },
  { id: 'aws', labelKey: `${SS}.tabs.aws`, icon: <FaAws className="h-4 w-4" /> },
  { id: 'vllm', labelKey: `${SS}.tabs.vllm`, icon: <BsCpu className="h-4 w-4" /> },
];

// ─────────────────────────────────────────────────────────────
// Field definitions
// ─────────────────────────────────────────────────────────────

function buildFieldConfigs(t: (key: string) => string): Record<TabId, { fields: Record<string, FieldConfig>; filterPrefix: string }> {
  return {
    default: {
      filterPrefix: 'vision_language',
      fields: {
        VISION_LANGUAGE_MODEL_PROVIDER: {
          label: t(`${SS}.fields.defaultProvider`),
          type: 'select',
          description: t(`${SS}.fields.defaultProviderDesc`),
          required: true,
          options: [
            { value: 'openai', label: 'OpenAI' },
            { value: 'anthropic', label: 'Anthropic' },
            { value: 'gemini', label: 'Gemini' },
            { value: 'aws_bedrock', label: 'AWS Bedrock' },
            { value: 'vllm', label: 'vLLM' },
            { value: 'no_model', label: t(`${SS}.fields.noModel`) },
          ],
        },
      },
    },
    openai: {
      filterPrefix: 'VL_OPENAI',
      fields: {
        VL_OPENAI_API_KEY: { label: t(`${SS}.fields.apiKey`), type: 'password', description: t(`${SS}.fields.openaiApiKeyDesc`), required: true },
        VL_OPENAI_API_BASE_URL: { label: t(`${SS}.fields.apiBaseUrl`), type: 'text', description: t(`${SS}.fields.openaiBaseUrlDesc`), required: false, placeholder: 'https://api.openai.com/v1' },
        VL_OPENAI_MODEL_DEFAULT: {
          label: t(`${SS}.fields.defaultModel`), type: 'select', description: t(`${SS}.fields.openaiModelDesc`), required: true,
          options: [
            { value: 'gpt-4o', label: 'GPT-4o' },
            { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
            { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
          ],
        },
        VL_OPENAI_TEMPERATURE: { label: t(`${SS}.fields.temperature`), type: 'number', description: t(`${SS}.fields.temperatureDesc`), required: false, min: 0, max: 2, step: 0.1 },
        VL_OPENAI_IMAGE_QUALITY: {
          label: t(`${SS}.fields.imageQuality`), type: 'select', description: t(`${SS}.fields.imageQualityDesc`), required: false,
          options: [
            { value: 'auto', label: 'Auto' },
            { value: 'low', label: 'Low' },
            { value: 'high', label: 'High' },
          ],
        },
        VL_OPENAI_BATCH_SIZE: { label: t(`${SS}.fields.batchSize`), type: 'number', description: t(`${SS}.fields.batchSizeDesc`), required: false, min: 1, max: 50, step: 1 },
      },
    },
    anthropic: {
      filterPrefix: 'VL_ANTHROPIC',
      fields: {
        VL_ANTHROPIC_API_KEY: { label: t(`${SS}.fields.apiKey`), type: 'password', description: t(`${SS}.fields.anthropicApiKeyDesc`), required: true },
        VL_ANTHROPIC_MODEL_DEFAULT: {
          label: t(`${SS}.fields.defaultModel`), type: 'select', description: t(`${SS}.fields.anthropicModelDesc`), required: true,
          options: [
            { value: 'claude-opus-4-20250514', label: 'Claude Opus 4 (2025-05-14)' },
            { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (2025-05-14)' },
          ],
        },
        VL_ANTHROPIC_TEMPERATURE: { label: t(`${SS}.fields.temperature`), type: 'number', description: t(`${SS}.fields.temperatureDesc`), required: false, min: 0, max: 1, step: 0.1 },
        VL_ANTHROPIC_IMAGE_QUALITY: {
          label: t(`${SS}.fields.imageQuality`), type: 'select', description: t(`${SS}.fields.imageQualityDesc`), required: false,
          options: [
            { value: 'auto', label: 'Auto' },
            { value: 'low', label: 'Low' },
            { value: 'high', label: 'High' },
          ],
        },
        VL_ANTHROPIC_BATCH_SIZE: { label: t(`${SS}.fields.batchSize`), type: 'number', description: t(`${SS}.fields.batchSizeDesc`), required: false, min: 1, max: 50, step: 1 },
      },
    },
    gemini: {
      filterPrefix: 'VL_GEMINI',
      fields: {
        VL_GEMINI_API_KEY: { label: t(`${SS}.fields.apiKey`), type: 'password', description: t(`${SS}.fields.geminiApiKeyDesc`), required: true },
        VL_GEMINI_MODEL_DEFAULT: {
          label: t(`${SS}.fields.defaultModel`), type: 'select', description: t(`${SS}.fields.geminiModelDesc`), required: true,
          options: [
            { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
            { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
          ],
        },
        VL_GEMINI_TEMPERATURE: { label: t(`${SS}.fields.temperature`), type: 'number', description: t(`${SS}.fields.temperatureDesc`), required: false, min: 0, max: 2, step: 0.1 },
        VL_GEMINI_IMAGE_QUALITY: {
          label: t(`${SS}.fields.imageQuality`), type: 'select', description: t(`${SS}.fields.imageQualityDesc`), required: false,
          options: [
            { value: 'auto', label: 'Auto' },
            { value: 'low', label: 'Low' },
            { value: 'high', label: 'High' },
          ],
        },
        VL_GEMINI_BATCH_SIZE: { label: t(`${SS}.fields.batchSize`), type: 'number', description: t(`${SS}.fields.batchSizeDesc`), required: false, min: 1, max: 50, step: 1 },
      },
    },
    aws: {
      filterPrefix: 'VL_AWS',
      fields: {
        VL_AWS_ACCESS_KEY_ID: { label: t(`${SS}.fields.awsAccessKeyId`), type: 'password', description: t(`${SS}.fields.awsAccessKeyIdDesc`), required: true },
        VL_AWS_SECRET_ACCESS_KEY: { label: t(`${SS}.fields.awsSecretAccessKey`), type: 'password', description: t(`${SS}.fields.awsSecretAccessKeyDesc`), required: true },
        VL_AWS_REGION: {
          label: t(`${SS}.fields.awsRegion`), type: 'select', description: t(`${SS}.fields.awsRegionDesc`), required: true,
          options: [
            { value: 'us-east-1', label: 'US East (N. Virginia)' },
            { value: 'us-west-2', label: 'US West (Oregon)' },
            { value: 'eu-west-1', label: 'EU (Ireland)' },
            { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
            { value: 'ap-northeast-2', label: 'Asia Pacific (Seoul)' },
          ],
        },
        VL_AWS_ENDPOINT_URL: { label: t(`${SS}.fields.awsEndpointUrl`), type: 'text', description: t(`${SS}.fields.awsEndpointUrlDesc`), required: false },
        VL_AWS_MODEL_DEFAULT: { label: t(`${SS}.fields.defaultModel`), type: 'text', description: t(`${SS}.fields.awsModelDesc`), required: true },
      },
    },
    vllm: {
      filterPrefix: 'VL_VLLM',
      fields: {
        VL_VLLM_API_BASE_URL: { label: t(`${SS}.fields.apiBaseUrl`), type: 'text', description: t(`${SS}.fields.vllmBaseUrlDesc`), required: true },
        VL_VLLM_API_KEY: { label: t(`${SS}.fields.apiKey`), type: 'password', description: t(`${SS}.fields.vllmApiKeyDesc`), required: false },
        VL_VLLM_MODEL_NAME: { label: t(`${SS}.fields.modelName`), type: 'text', description: t(`${SS}.fields.vllmModelNameDesc`), required: true },
        VL_VLLM_TEMPERATURE: { label: t(`${SS}.fields.temperature`), type: 'number', description: t(`${SS}.fields.temperatureDesc`), required: false, min: 0, max: 2, step: 0.1 },
        VL_VLLM_MAX_TOKENS: { label: t(`${SS}.fields.maxTokens`), type: 'number', description: t(`${SS}.fields.maxTokensDesc`), required: false, min: 1, max: 65536, step: 1 },
        VL_VLLM_BATCH_SIZE: { label: t(`${SS}.fields.batchSize`), type: 'number', description: t(`${SS}.fields.batchSizeDesc`), required: false, min: 1, max: 50, step: 1 },
      },
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────

const AdminSettingVlPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<TabId>('default');
  const [configData, setConfigData] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

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
            onClick={loadConfigs}
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
        ) : (
          <BaseConfigPanel
            configData={configData}
            fieldConfigs={tabConfig.fields}
            filterPrefix={tabConfig.filterPrefix}
            onConfigChange={loadConfigs}
            showTestConnection={activeTab !== 'default'}
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
  id: 'admin-setting-vl',
  name: 'AdminSettingVl',
  adminSection: 'admin-setting',
  routes: {
    'admin-setting-vl': AdminSettingVlPage,
  },
};

export default feature;
