'use client';

import React from 'react';
import styles from '../styles/dashboard.module.scss';
import type { TopWorkflowItem } from '../types';
import { useTranslation } from '@xgen/i18n';
import { Button } from '@xgen/ui';
import { FiChevronRight } from '@xgen/icons';

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

export default TopWorkflowsSection;
