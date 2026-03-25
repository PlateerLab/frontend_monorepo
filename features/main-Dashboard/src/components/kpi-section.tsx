'use client';

import React from 'react';
import styles from '../styles/dashboard.module.scss';
import type { DashboardOverview } from '../types';
import { useTranslation } from '@xgen/i18n';

interface KpiSectionProps {
  overview: DashboardOverview;
}

export const KpiSection: React.FC<KpiSectionProps> = ({ overview }) => {
  const { t } = useTranslation();

  const kpis = [
    { key: 'total', value: overview.total, className: styles.total },
    { key: 'normal', value: overview.normal, className: styles.normal },
    { key: 'paused', value: overview.paused, className: styles.paused },
    { key: 'error', value: overview.error, className: styles.error },
  ];

  return (
    <section className={styles.kpiSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          {t('dashboard.workplaceOverview')}
        </h2>
        {overview.updatedAt && (
          <span className={styles.updatedAt}>
            {t('dashboard.lastUpdated', { time: overview.updatedAt })}
          </span>
        )}
      </div>

      <div className={styles.kpiGrid}>
        {kpis.map(({ key, value, className }) => (
          <div key={key} className={`${styles.kpiCard} ${className}`}>
            <p className={styles.kpiLabel}>
              {t(`dashboard.kpi.${key}`)}
            </p>
            <p className={styles.kpiValue}>{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default KpiSection;
