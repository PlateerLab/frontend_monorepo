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

const SS = 'admin.settings.database';

// -----------------------------------------------------------------
// Field Configs
// -----------------------------------------------------------------

const DATABASE_FIELDS: Record<string, FieldConfig> = {
  DATABASE_TYPE: {
    label: 'Database Type',
    type: 'select',
    description: 'Type of database to use.',
    required: true,
    options: [
      { value: 'postgresql', label: 'PostgreSQL' },
      { value: 'sqlite', label: 'SQLite' },
      { value: 'mysql', label: 'MySQL' },
      { value: 'mongodb', label: 'MongoDB' },
    ],
  },
  POSTGRES_HOST: {
    label: 'PostgreSQL Host',
    type: 'text',
    placeholder: 'localhost',
    description: 'Hostname for the PostgreSQL server.',
    required: false,
  },
  POSTGRES_PORT: {
    label: 'PostgreSQL Port',
    type: 'number',
    description: 'Port number for the PostgreSQL server.',
    required: false,
    min: 1,
    max: 65535,
  },
  POSTGRES_DB: {
    label: 'PostgreSQL Database',
    type: 'text',
    placeholder: 'plateerag',
    description: 'PostgreSQL database name.',
    required: false,
  },
  POSTGRES_USER: {
    label: 'PostgreSQL User',
    type: 'text',
    description: 'PostgreSQL username.',
    required: false,
  },
  POSTGRES_PASSWORD: {
    label: 'PostgreSQL Password',
    type: 'password',
    description: 'PostgreSQL password.',
    required: false,
  },
  SQLITE_PATH: {
    label: 'SQLite Path',
    type: 'text',
    description: 'File path for the SQLite database.',
    required: false,
  },
  AUTO_MIGRATION: {
    label: 'Auto Migration',
    type: 'boolean',
    description: 'Enable automatic database migration on startup.',
    required: false,
  },
};

// -----------------------------------------------------------------
// Page Component
// -----------------------------------------------------------------

const AdminSettingDatabasePage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

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
    >
      <BaseConfigPanel
        configData={configData}
        fieldConfigs={DATABASE_FIELDS}
        filterPrefix="database"
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
  id: 'admin-setting-database',
  name: 'AdminSettingDatabasePage',
  adminSection: 'admin-setting',
  routes: {
    'admin-setting-database': AdminSettingDatabasePage,
  },
};

export default feature;
