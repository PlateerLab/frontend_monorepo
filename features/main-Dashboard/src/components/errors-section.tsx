'use client';

import React from 'react';
import styles from '../styles/dashboard.module.scss';
import type { DashboardErrorItem } from '../types';
import { useTranslation } from '@xgen/i18n';

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
          <button onClick={onViewAll} className={styles.viewAllLink}>
            {t('common.viewAll')}
            <ChevronRightIcon />
          </button>
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
                  <AlertDangerIcon className={styles.errorIcon} />
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

const ChevronRightIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AlertDangerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 6V10M10 14H10.01M8.57465 2.90482L1.51793 14.5033C1.19058 15.0567 1.02691 15.3334 1.04231 15.5588C1.05574 15.7555 1.15153 15.9374 1.30641 16.0598C1.48308 16.2 1.80405 16.2 2.44599 16.2H16.5593C17.2013 16.2 17.5222 16.2 17.6989 16.0598C17.8538 15.9374 17.9496 15.7555 17.963 15.5588C17.9784 15.3334 17.8147 15.0567 17.4874 14.5033L10.4307 2.90482C10.1045 2.35339 9.94137 2.07768 9.72755 1.9869C9.54087 1.90768 9.32943 1.90768 9.14275 1.9869C8.92893 2.07768 8.76576 2.35339 8.43944 2.90482L8.57465 2.90482Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default ErrorsSection;
