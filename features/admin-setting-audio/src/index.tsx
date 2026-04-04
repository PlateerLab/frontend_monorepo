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

const SS = 'admin.settings.audio';

type TabId = 'stt' | 'tts';

const TABS: { id: TabId; labelKey: string }[] = [
  { id: 'stt', labelKey: `${SS}.tabs.stt` },
  { id: 'tts', labelKey: `${SS}.tabs.tts` },
];

// -----------------------------------------------------------------
// Field Configs
// -----------------------------------------------------------------

const STT_FIELDS: Record<string, FieldConfig> = {
  STT_PROVIDER: {
    label: 'STT Provider',
    type: 'select',
    description: 'Speech-to-text provider.',
    required: true,
    options: [
      { value: 'whisper', label: 'Whisper' },
      { value: 'google', label: 'Google' },
      { value: 'azure', label: 'Azure' },
    ],
  },
  STT_MODEL: {
    label: 'STT Model',
    type: 'select',
    description: 'Speech-to-text model to use.',
    required: false,
    options: [
      { value: 'whisper-large-v3', label: 'whisper-large-v3' },
      { value: 'whisper-medium', label: 'whisper-medium' },
      { value: 'whisper-small', label: 'whisper-small' },
    ],
  },
  STT_DEVICE: {
    label: 'STT Device',
    type: 'select',
    description: 'Device to run the STT model on.',
    required: false,
    options: [
      { value: 'cpu', label: 'CPU' },
      { value: 'cuda', label: 'CUDA' },
    ],
  },
  STT_LANGUAGE: {
    label: 'STT Language',
    type: 'text',
    placeholder: 'ko',
    description: 'Language code for speech-to-text.',
    required: false,
  },
};

const TTS_FIELDS: Record<string, FieldConfig> = {
  TTS_PROVIDER: {
    label: 'TTS Provider',
    type: 'select',
    description: 'Text-to-speech provider.',
    required: true,
    options: [
      { value: 'zonos', label: 'Zonos' },
      { value: 'openai_tts', label: 'OpenAI TTS' },
    ],
  },
  TTS_MODEL: {
    label: 'TTS Model',
    type: 'text',
    description: 'Text-to-speech model name.',
    required: false,
  },
  TTS_SPEAKER: {
    label: 'TTS Speaker',
    type: 'text',
    description: 'Speaker voice for text-to-speech.',
    required: false,
  },
  TTS_LANGUAGE: {
    label: 'TTS Language',
    type: 'text',
    placeholder: 'ko',
    description: 'Language code for text-to-speech.',
    required: false,
  },
};

const TAB_CONFIG: Record<TabId, { fields: Record<string, FieldConfig>; filterPrefix: string }> = {
  stt: { fields: STT_FIELDS, filterPrefix: 'stt' },
  tts: { fields: TTS_FIELDS, filterPrefix: 'tts' },
};

// -----------------------------------------------------------------
// Page Component
// -----------------------------------------------------------------

const AdminSettingAudioPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<TabId>('stt');
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
      <ContentArea
        title={t(`${SS}.title`)}
        description={t(`${SS}.description`)}
      >
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <FiRefreshCw className="h-8 w-8 animate-spin" />
          <p className="text-sm">{t(`${SS}.loading`)}</p>
        </div>
      </ContentArea>
    );
  }

  return (
    <ContentArea
      title={t(`${SS}.title`)}
      description={t(`${SS}.description`)}
      toolbar={
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
      }
    >
      <BaseConfigPanel
        configData={configData}
        fieldConfigs={currentConfig.fields}
        filterPrefix={currentConfig.filterPrefix}
        onConfigChange={loadConfigs}
        showTestConnection={false}
      />
    </ContentArea>
  );
};

// -----------------------------------------------------------------
// Feature Module
// -----------------------------------------------------------------

const feature: AdminFeatureModule = {
  id: 'admin-setting-audio',
  name: 'AdminSettingAudioPage',
  adminSection: 'admin-setting',
  routes: {
    'admin-setting-audio': AdminSettingAudioPage,
  },
};

export default feature;
