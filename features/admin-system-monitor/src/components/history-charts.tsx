'use client';

import React from 'react';
import { useTranslation } from '@xgen/i18n';
import type { HistoryEntry } from '../types';

interface HistoryChartsProps {
  history: HistoryEntry[];
  hasGpu: boolean;
}

function MiniChart({ data, color, label }: { data: number[]; color: string; label: string }) {
  if (data.length === 0) return null;

  const max = 100;
  const width = 100;
  const height = 40;
  const points = data.map((v, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * width;
    const y = height - (v / max) * height;
    return `${x},${y}`;
  });

  const pathD = `M${points.join(' L')}`;
  const areaD = `${pathD} L${width},${height} L0,${height} Z`;
  const current = data[data.length - 1];

  return (
    <div className="flex flex-col gap-2 p-4 rounded-lg bg-card border border-border">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-sm font-bold text-foreground">{current.toFixed(1)}%</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-10" preserveAspectRatio="none">
        <path d={areaD} fill={color} opacity={0.15} />
        <path d={pathD} fill="none" stroke={color} strokeWidth={1.5} />
      </svg>
    </div>
  );
}

export const HistoryCharts: React.FC<HistoryChartsProps> = ({ history, hasGpu }) => {
  const { t } = useTranslation();

  const cpuData = history.map((h) => h.cpu);
  const memData = history.map((h) => h.memory);
  const gpuData = hasGpu ? history.map((h) => h.gpu ?? 0) : [];

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-foreground">
        {t('admin.pages.systemMonitor.history', 'Resource History')}
      </h2>
      <div className={`grid gap-4 ${hasGpu ? 'grid-cols-3 max-lg:grid-cols-1' : 'grid-cols-2 max-lg:grid-cols-1'}`}>
        <MiniChart
          data={cpuData}
          color="#3b82f6"
          label={t('admin.pages.systemMonitor.cpu', 'CPU')}
        />
        <MiniChart
          data={memData}
          color="#8b5cf6"
          label={t('admin.pages.systemMonitor.memory', 'Memory')}
        />
        {hasGpu && gpuData.length > 0 && (
          <MiniChart
            data={gpuData}
            color="#10b981"
            label="GPU"
          />
        )}
      </div>
    </div>
  );
};
