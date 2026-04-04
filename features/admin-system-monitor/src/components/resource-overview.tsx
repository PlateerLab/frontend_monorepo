'use client';

import React from 'react';
import { useTranslation } from '@xgen/i18n';
import { formatBytes, getCPUStatus, getMemoryStatus, getDiskStatus, formatUptime } from '@xgen/api-client';
import type { SystemData, ResourceStatus } from '../types';

interface ResourceCardProps {
  label: string;
  value: string;
  percent: number;
  status: ResourceStatus;
}

const statusColors: Record<ResourceStatus, string> = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
};

const statusBg: Record<ResourceStatus, string> = {
  low: 'bg-green-50 dark:bg-green-950',
  medium: 'bg-yellow-50 dark:bg-yellow-950',
  high: 'bg-orange-50 dark:bg-orange-950',
  critical: 'bg-red-50 dark:bg-red-950',
};

function ResourceCard({ label, value, percent, status }: ResourceCardProps) {
  return (
    <div className={`rounded-xl p-5 ${statusBg[status]} border border-border`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full text-white ${statusColors[status]}`}>
          {status}
        </span>
      </div>
      <p className="text-2xl font-bold text-foreground mb-2">{percent.toFixed(1)}%</p>
      <p className="text-xs text-muted-foreground">{value}</p>
      <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${statusColors[status]}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}

interface ResourceOverviewProps {
  data: SystemData;
}

export const ResourceOverview: React.FC<ResourceOverviewProps> = ({ data }) => {
  const { t } = useTranslation();
  const { cpu, memory, disk, gpu, uptime } = data;

  const cards: ResourceCardProps[] = [
    {
      label: t('admin.pages.systemMonitor.cpu', 'CPU'),
      value: `${cpu.core_count} cores / ${cpu.frequency_current?.toFixed(0) ?? '-'} MHz`,
      percent: cpu.usage_percent,
      status: getCPUStatus(cpu.usage_percent),
    },
    {
      label: t('admin.pages.systemMonitor.memory', 'Memory'),
      value: `${formatBytes(memory.used)} / ${formatBytes(memory.total)}`,
      percent: memory.percent,
      status: getMemoryStatus(memory.percent),
    },
  ];

  if (gpu && gpu.length > 0) {
    gpu.forEach((g, idx) => {
      cards.push({
        label: `GPU ${idx}${g.name ? ` (${g.name})` : ''}`,
        value: `${formatBytes(g.memory_used)} / ${formatBytes(g.memory_total)} • ${g.temperature}°C`,
        percent: g.utilization,
        status: g.utilization < 50 ? 'low' : g.utilization < 80 ? 'medium' : g.utilization < 95 ? 'high' : 'critical',
      });
    });
  }

  if (disk.length > 0) {
    const primary = disk[0];
    cards.push({
      label: t('admin.pages.systemMonitor.disk', 'Disk'),
      value: `${formatBytes(primary.used)} / ${formatBytes(primary.total)} (${primary.mountpoint})`,
      percent: primary.percent,
      status: getDiskStatus(primary.percent),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          {t('admin.pages.systemMonitor.overview', 'System Overview')}
        </h2>
        <span className="text-xs text-muted-foreground">
          Uptime: {formatUptime(uptime)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1 xl:grid-cols-4">
        {cards.map((card, i) => (
          <ResourceCard key={i} {...card} />
        ))}
      </div>
    </div>
  );
};
