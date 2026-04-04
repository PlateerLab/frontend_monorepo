'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { streamSystemStatus, getSystemStatus } from '@xgen/api-client';
import type { SystemData, ConnectionState, HistoryEntry } from './types';
import { ResourceOverview } from './components/resource-overview';
import { HistoryCharts } from './components/history-charts';
import { DiskTable } from './components/disk-table';
import { NetworkTable } from './components/network-table';
import { ConnectionStatus } from './components/connection-status';

const MAX_HISTORY = 40;

const AdminSystemMonitorPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<SystemData | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [isStreaming, setIsStreaming] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const cleanupRef = useRef<(() => void) | null>(null);

  const startStream = useCallback(() => {
    setConnectionState('connecting');

    const cleanup = streamSystemStatus(
      (newData) => {
        setConnectionState('connected');
        setData(newData);
        setHistory((prev) => {
          const entry: HistoryEntry = {
            timestamp: Date.now(),
            cpu: newData.cpu.usage_percent,
            memory: newData.memory.percent,
            gpu: newData.gpu?.[0]?.utilization,
          };
          const next = [...prev, entry];
          return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
        });
      },
      () => {
        setConnectionState('disconnected');
      },
    );

    cleanupRef.current = cleanup;
  }, []);

  const stopStream = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    setConnectionState('disconnected');
  }, []);

  const toggleStream = useCallback(() => {
    if (isStreaming) {
      stopStream();
      setIsStreaming(false);
    } else {
      startStream();
      setIsStreaming(true);
    }
  }, [isStreaming, startStream, stopStream]);

  useEffect(() => {
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    getSystemStatus()
      .then((initialData) => {
        if (fallbackTimer) clearTimeout(fallbackTimer);
        setData(initialData);
      })
      .catch(() => { /* will be covered by stream or fallback */ });

    startStream();

    // If no data after 5s (API unreachable), show mock data so page isn't stuck loading
    fallbackTimer = setTimeout(() => {
      setData((prev) => {
        if (prev) return prev;
        return {
          cpu: { usage_percent: 0, core_count: 0, frequency_current: 0, frequency_max: 0, load_average: [] },
          memory: { total: 0, available: 0, percent: 0, used: 0, free: 0 },
          gpu: null,
          network: [],
          disk: [],
          uptime: 0,
        };
      });
      setConnectionState('disconnected');
    }, 5000);

    return () => {
      if (fallbackTimer) clearTimeout(fallbackTimer);
      cleanupRef.current?.();
    };
  }, [startStream]);

  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {t('admin.pages.systemMonitor.title', 'System Monitor')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('admin.pages.systemMonitor.description', 'Real-time system resource monitoring')}
            </p>
          </div>
          <ConnectionStatus
            state={connectionState}
            isStreaming={isStreaming}
            onToggle={toggleStream}
          />
        </div>

        {!data ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">
                {t('admin.pages.systemMonitor.loading', 'Loading system data...')}
              </p>
            </div>
          </div>
        ) : data.cpu.core_count === 0 && connectionState === 'disconnected' ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-muted-foreground">
                {t('admin.pages.systemMonitor.unavailable', 'System monitoring data is unavailable. The backend may be offline.')}
              </p>
              <button
                onClick={() => { startStream(); setIsStreaming(true); }}
                className="text-sm px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {t('common.retry', 'Retry')}
              </button>
            </div>
          </div>
        ) : (
          <>
            <ResourceOverview data={data} />
            {history.length > 1 && (
              <HistoryCharts
                history={history}
                hasGpu={!!data.gpu && data.gpu.length > 0}
              />
            )}
            {data.disk.length > 0 && <DiskTable disks={data.disk} />}
            {data.network.length > 0 && <NetworkTable networks={data.network} />}
          </>
        )}
      </div>
    </ContentArea>
  );
};

const feature: AdminFeatureModule = {
  id: 'admin-system-monitor',
  name: 'AdminSystemMonitorPage',
  adminSection: 'admin-system',
  routes: {
    'admin-system-monitor': AdminSystemMonitorPage,
  },
};

export default feature;
