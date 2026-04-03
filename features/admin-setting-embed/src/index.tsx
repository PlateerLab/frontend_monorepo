'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea, useToast } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { FiRefreshCw } from '@xgen/icons';
import {
  BaseConfigPanel,
  fetchAllConfigs,
  type ConfigItem,
  type FieldConfig,
} from '@xgen/admin-setting-shared';

// -----------------------------------------------------------------
// Constants
// -----------------------------------------------------------------

const SS = 'admin.settings.embed';

type TabId = 'embedding' | 'reranker' | 'vectordb';

const TABS: { id: TabId; labelKey: string }[] = [
  { id: 'embedding', labelKey: `${SS}.tabs.embedding` },
  { id: 'reranker', labelKey: `${SS}.tabs.reranker` },
  { id: 'vectordb', labelKey: `${SS}.tabs.vectordb` },
];

// -----------------------------------------------------------------
// Field Configs
// -----------------------------------------------------------------

const EMBEDDING_FIELDS: Record<string, FieldConfig> = {
  EMBEDDING_PROVIDER: {
    label: 'Embedding Provider',
    type: 'select',
    description: 'Select the embedding provider to use.',
    required: true,
    options: [
      { value: 'openai', label: 'OpenAI' },
      { value: 'voyage', label: 'Voyage' },
      { value: 'custom_http', label: 'Custom HTTP' },
    ],
  },
  OPENAI_EMBEDDING_MODEL: {
    label: 'OpenAI Embedding Model',
    type: 'select',
    description: 'OpenAI embedding model name.',
    required: false,
    options: [
      { value: 'text-embedding-3-small', label: 'text-embedding-3-small' },
      { value: 'text-embedding-3-large', label: 'text-embedding-3-large' },
      { value: 'text-embedding-ada-002', label: 'text-embedding-ada-002' },
    ],
  },
  OPENAI_EMBEDDING_API_KEY: {
    label: 'OpenAI Embedding API Key',
    type: 'password',
    description: 'API key for OpenAI embedding service.',
    required: false,
  },
  VOYAGE_API_KEY: {
    label: 'Voyage API Key',
    type: 'password',
    description: 'API key for Voyage embedding service.',
    required: false,
  },
  VOYAGE_MODEL: {
    label: 'Voyage Model',
    type: 'select',
    description: 'Voyage embedding model to use.',
    required: false,
    options: [
      { value: 'voyage-3', label: 'voyage-3' },
      { value: 'voyage-3-lite', label: 'voyage-3-lite' },
      { value: 'voyage-code-3', label: 'voyage-code-3' },
      { value: 'voyage-multilingual-2', label: 'voyage-multilingual-2' },
    ],
  },
  CUSTOM_EMBEDDING_URL: {
    label: 'Custom Embedding URL',
    type: 'text',
    description: 'URL for custom HTTP embedding endpoint.',
    required: false,
  },
  CUSTOM_EMBEDDING_API_KEY: {
    label: 'Custom Embedding API Key',
    type: 'password',
    description: 'API key for custom HTTP embedding endpoint.',
    required: false,
  },
};

const RERANKER_FIELDS: Record<string, FieldConfig> = {
  RERANKER_PROVIDER: {
    label: 'Reranker Provider',
    type: 'select',
    description: 'Select the reranker provider.',
    required: true,
    options: [
      { value: 'sentence_transformer', label: 'Sentence Transformer' },
      { value: 'vllm', label: 'vLLM' },
    ],
  },
  RERANKER_MODEL: {
    label: 'Reranker Model',
    type: 'select',
    description: 'Reranker model to use.',
    required: false,
    options: [
      { value: 'cross-encoder/ms-marco-MiniLM-L-12-v2', label: 'cross-encoder/ms-marco-MiniLM-L-12-v2' },
      { value: 'BAAI/bge-reranker-v2-m3', label: 'BAAI/bge-reranker-v2-m3' },
    ],
  },
  RERANKER_DEVICE: {
    label: 'Reranker Device',
    type: 'select',
    description: 'Device to run the reranker on.',
    required: false,
    options: [
      { value: 'cpu', label: 'CPU' },
      { value: 'cuda', label: 'CUDA' },
    ],
  },
  RERANKER_VLLM_URL: {
    label: 'Reranker vLLM URL',
    type: 'text',
    description: 'URL for the vLLM reranker service.',
    required: false,
  },
  RERANKER_VLLM_MODEL: {
    label: 'Reranker vLLM Model',
    type: 'text',
    description: 'Model name for the vLLM reranker.',
    required: false,
  },
};

const VECTORDB_FIELDS: Record<string, FieldConfig> = {
  QDRANT_VECTOR_DIMENSION: {
    label: 'Qdrant Vector Dimension',
    type: 'number',
    description: 'Dimension of the embedding vectors.',
    required: false,
    min: 1,
    max: 4096,
  },
  QDRANT_HOST: {
    label: 'Qdrant Host',
    type: 'text',
    placeholder: 'localhost',
    description: 'Hostname for the Qdrant server.',
    required: false,
  },
  QDRANT_PORT: {
    label: 'Qdrant Port',
    type: 'number',
    description: 'Port number for the Qdrant server.',
    required: false,
    min: 1,
    max: 65535,
  },
  QDRANT_API_KEY: {
    label: 'Qdrant API Key',
    type: 'password',
    description: 'API key for the Qdrant server.',
    required: false,
  },
  QDRANT_USE_GRPC: {
    label: 'Qdrant Use gRPC',
    type: 'boolean',
    description: 'Whether to use gRPC for Qdrant connections.',
    required: false,
  },
  QDRANT_GRPC_PORT: {
    label: 'Qdrant gRPC Port',
    type: 'number',
    description: 'gRPC port number for the Qdrant server.',
    required: false,
    min: 1,
    max: 65535,
  },
};

const TAB_CONFIG: Record<TabId, { fields: Record<string, FieldConfig>; filterPrefix: string }> = {
  embedding: { fields: EMBEDDING_FIELDS, filterPrefix: 'embedding' },
  reranker: { fields: RERANKER_FIELDS, filterPrefix: 'reranker' },
  vectordb: { fields: VECTORDB_FIELDS, filterPrefix: 'qdrant' },
};

// -----------------------------------------------------------------
// Page Component
// -----------------------------------------------------------------

const AdminSettingEmbedPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<TabId>('embedding');
  const [configData, setConfigData] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllConfigs();
      if (data?.persistent_summary?.configs) {
        setConfigData(data.persistent_summary.configs as ConfigItem[]);
      }
    } catch {
      toast.error(t(`${SS}.loadFailed`));
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  const currentConfig = TAB_CONFIG[activeTab];

  if (loading && configData.length === 0) {
    return (
      <ContentArea>
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <FiRefreshCw className="h-8 w-8 animate-spin" />
          <p className="text-sm">{t(`${SS}.loading`)}</p>
        </div>
      </ContentArea>
    );
  }

  return (
    <ContentArea>
      <div className="flex flex-col gap-4 p-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-foreground">{t(`${SS}.title`)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t(`${SS}.description`)}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>

        {/* Panel */}
        <BaseConfigPanel
          configData={configData}
          fieldConfigs={currentConfig.fields}
          filterPrefix={currentConfig.filterPrefix}
          onConfigChange={loadConfigs}
          showTestConnection={false}
        />
      </div>
    </ContentArea>
  );
};

// -----------------------------------------------------------------
// Feature Module
// -----------------------------------------------------------------

const feature: AdminFeatureModule = {
  id: 'admin-setting-embed',
  name: 'AdminSettingEmbedPage',
  adminSection: 'admin-setting',
  routes: {
    'admin-setting-embed': AdminSettingEmbedPage,
  },
};

export default feature;
