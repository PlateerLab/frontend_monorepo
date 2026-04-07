'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { getServerStatus } from '@xgen/api-client';
import { FiRefreshCw } from '@xgen/icons';
import type { ServiceInfo, HealthStats } from './types';
import { HealthStatsCards } from './components/health-stats';
import { ServiceTable } from './components/service-table';
import { ServiceDetail } from './components/service-detail';

const AdminSystemHealthPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<ServiceInfo | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getServerStatus();
      const list = Object.entries(data).map(([id, info]) => ({
        ...info,
        id,
        name: info.name || id,
      }));
      setServices(list);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats: HealthStats = useMemo(() => {
    const total = services.length;
    const healthy = services.filter((s) => s.health).length;
    const unhealthy = total - healthy;
    const incompatible = services.filter((s) => s.versionCompatible === false).length;
    return { total, healthy, unhealthy, incompatible };
  }, [services]);

  return (
    <ContentArea
      title={t('admin.pages.systemHealth.title', 'System Health')}
      description={t('admin.pages.systemHealth.description', 'Service health and version compatibility')}
      headerActions={
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t('common.refresh', 'Refresh')}
        </button>
      }
    >
      {loading && services.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <HealthStatsCards stats={stats} />
            {selectedService && (
              <ServiceDetail
                service={selectedService}
                onClose={() => setSelectedService(null)}
              />
            )}
            <ServiceTable
              services={services}
              onSelect={setSelectedService}
            />
          </>
        )}
    </ContentArea>
  );
};

const feature: AdminFeatureModule = {
  id: 'admin-system-health',
  name: 'AdminSystemHealthPage',
  adminSection: 'admin-system',
  sidebarItems: [
    { id: 'admin-system-health', titleKey: 'admin.sidebar.system.systemHealth.title', descriptionKey: 'admin.sidebar.system.systemHealth.description' },
  ],
  routes: {
    'admin-system-health': AdminSystemHealthPage,
  },
};

export default feature;
