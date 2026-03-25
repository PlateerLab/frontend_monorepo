'use client';

import React from 'react';
import styles from '../styles/dashboard.module.scss';
import type { TopWorkflowItem } from '../types';
import { useTranslation } from '@xgen/i18n';

interface TopWorkflowsSectionProps {
  workflows: TopWorkflowItem[];
  onViewAll?: () => void;
}

export const TopWorkflowsSection: React.FC<TopWorkflowsSectionProps> = ({
  workflows,
  onViewAll,
}) => {
  const { t } = useTranslation();

  return (
    <section className={styles.workflowsSection}>
      <div className={styles.updatesSectionHeader}>
        <h3 className={styles.sectionTitle}>
          {t('dashboard.topWorkflows')}
        </h3>
        {onViewAll && (
          <button onClick={onViewAll} className={styles.viewAllLink}>
            {t('common.viewAll')}
            <ChevronRightIcon />
          </button>
        )}
      </div>

      <div className={styles.workflowsList}>
        {workflows.length === 0 ? (
          <div className={styles.workflowItem}>
            <span className={styles.workflowName}>
              {t('dashboard.noWorkflows')}
            </span>
          </div>
        ) : (
          workflows.map((workflow, index) => (
            <div key={workflow.id} className={styles.workflowItem}>
              <span className={styles.workflowRank}>{index + 1}</span>
              <span
                className={`${styles.workflowName} ${workflow.isLink ? styles.isLink : ''}`}
                onClick={workflow.onClick}
              >
                {workflow.name}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

const ChevronRightIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default TopWorkflowsSection;
