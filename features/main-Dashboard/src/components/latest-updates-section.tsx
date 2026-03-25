'use client';

import React from 'react';
import styles from '../styles/dashboard.module.scss';
import type { LatestUpdateItem } from '../types';
import { useTranslation } from '@xgen/i18n';

interface LatestUpdatesSectionProps {
  updates: LatestUpdateItem[];
  onViewAll?: () => void;
}

export const LatestUpdatesSection: React.FC<LatestUpdatesSectionProps> = ({
  updates,
  onViewAll,
}) => {
  const { t } = useTranslation();

  return (
    <section className={styles.updatesSection}>
      <div className={styles.updatesSectionHeader}>
        <h3 className={styles.sectionTitle}>
          {t('dashboard.latestUpdates')}
        </h3>
        {onViewAll && (
          <button onClick={onViewAll} className={styles.viewAllLink}>
            {t('common.viewAll')}
            <ChevronRightIcon />
          </button>
        )}
      </div>

      <div className={styles.updatesList}>
        {updates.length === 0 ? (
          <div className={styles.updateItem}>
            <span className={styles.updateText}>
              {t('dashboard.noUpdates')}
            </span>
          </div>
        ) : (
          updates.map((update) => (
            <div key={update.id} className={styles.updateItem}>
              <span className={styles.updatePrefix}>{update.prefix}</span>
              <span
                className={`${styles.updateText} ${update.isLink ? styles.isLink : ''}`}
                onClick={update.onClick}
              >
                {update.text}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

// Inline icon to avoid extra dependency
const ChevronRightIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default LatestUpdatesSection;
