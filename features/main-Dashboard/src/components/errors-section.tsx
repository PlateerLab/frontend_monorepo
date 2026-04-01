'use client';

import React from 'react';
import styles from '../styles/dashboard.module.scss';
import type { DashboardErrorItem } from '../types';
import { useTranslation } from '@xgen/i18n';
import { Button } from '@xgen/ui';
import { FiChevronRight, FiAlertCircle } from '@xgen/icons';

interface ErrorsSectionProps {
  errors: DashboardErrorItem[];
  onViewAll?: () => void;
}

export const ErrorsSection: React.FC<ErrorsSectionProps> = ({
  errors,
  onViewAll,
}) => {
  const { t } = useTranslation();

  return (
    <section className={styles.errorsSection}>
      <div className={styles.updatesSectionHeader}>
        <h3 className={styles.sectionTitle}>
          {t('dashboard.recentErrors')}
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

      <table className={styles.errorsTable}>
        <thead className={styles.errorsHeader}>
          <tr>
            <th style={{ width: 40 }}></th>
            <th>{t('dashboard.errors.workflow')}</th>
            <th>{t('dashboard.errors.time')}</th>
            <th>{t('dashboard.errors.message')}</th>
          </tr>
        </thead>
        <tbody className={styles.errorsBody}>
          {errors.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center' }}>
                {t('dashboard.noErrors')}
              </td>
            </tr>
          ) : (
            errors.map((error) => (
              <tr key={error.id}>
                <td>
                  <FiAlertCircle className={styles.errorIcon} />
                </td>
                <td className={styles.errorWorkflow}>
                  {error.workflowName}
                </td>
                <td className={styles.errorTime}>{error.time}</td>
                <td className={styles.errorMessage}>{error.message}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
};

export default ErrorsSection;
