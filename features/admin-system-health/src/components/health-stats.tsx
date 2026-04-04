'use client';

import React from 'react';
import { useTranslation } from '@xgen/i18n';
import type { HealthStats } from '../types';

interface HealthStatsCardsProps {
  stats: HealthStats;
}

export const HealthStatsCards: React.FC<HealthStatsCardsProps> = ({ stats }) => {
  const { t } = useTranslation();

  const cards = [
    { key: 'total', value: stats.total, color: 'border-l-primary', bg: 'bg-blue-50 dark:bg-blue-950' },
    { key: 'healthy', value: stats.healthy, color: 'border-l-green-500', bg: 'bg-green-50 dark:bg-green-950' },
    { key: 'unhealthy', value: stats.unhealthy, color: 'border-l-red-500', bg: 'bg-red-50 dark:bg-red-950' },
    { key: 'incompatible', value: stats.incompatible, color: 'border-l-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950' },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
      {cards.map(({ key, value, color, bg }) => (
        <div key={key} className={`p-5 rounded-xl border-l-4 ${color} ${bg} border border-border`}>
          <p className="text-sm text-muted-foreground mb-1">
            {t(`admin.pages.systemHealth.stats.${key}`, key)}
          </p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
        </div>
      ))}
    </div>
  );
};
