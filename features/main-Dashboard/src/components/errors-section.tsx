'use client';

import React from 'react';
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
    <section className="flex flex-col bg-white rounded-xl shadow-md overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground m-0">
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

      <table className="w-full border-collapse">
        <thead className="bg-muted">
          <tr>
            <th style={{ width: 40 }} className="px-4 py-2 text-xs font-semibold text-muted-foreground text-left uppercase tracking-wider"></th>
            <th className="px-4 py-2 text-xs font-semibold text-muted-foreground text-left uppercase tracking-wider">{t('dashboard.errors.agentflow')}</th>
            <th className="px-4 py-2 text-xs font-semibold text-muted-foreground text-left uppercase tracking-wider">{t('dashboard.errors.time')}</th>
            <th className="px-4 py-2 text-xs font-semibold text-muted-foreground text-left uppercase tracking-wider">{t('dashboard.errors.message')}</th>
          </tr>
        </thead>
        <tbody>
          {errors.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-2 text-sm text-foreground text-center">
                {t('dashboard.noErrors')}
              </td>
            </tr>
          ) : (
            errors.map((error) => (
              <tr key={error.id} className="border-b border-border last:border-b-0 hover:bg-primary/[0.02]">
                <td className="px-4 py-2 text-sm text-foreground align-middle">
                  <FiAlertCircle className="w-5 h-5 text-red-500" />
                </td>
                <td className="px-4 py-2 text-sm text-foreground align-middle">
                  {error.workflowName}
                </td>
                <td className="px-4 py-2 text-sm text-muted-foreground/60 whitespace-nowrap align-middle">{error.time}</td>
                <td className="px-4 py-2 text-sm text-muted-foreground max-w-[300px] truncate align-middle">{error.message}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
};

export default ErrorsSection;
