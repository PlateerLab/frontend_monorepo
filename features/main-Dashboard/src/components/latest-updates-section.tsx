'use client';

import React from 'react';
import styles from '../styles/dashboard.module.scss';
import type { LatestUpdateItem } from '../types';
import { useTranslation } from '@xgen/i18n';
import { Button } from '@xgen/ui';
import { FiChevronRight } from '@xgen/icons';

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
          <Button
            variant="outline"
            size="sm"
            onClick={onViewAll}
            rightIcon={<FiChevronRight />}
          >
            {t('common.viewAll')}
          </Button>
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

export default LatestUpdatesSection;
