'use client';

import React, { useMemo, useState } from 'react';
import { Modal } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import type { AgentflowUsageDetail } from '../types';

interface AgentflowRow {
  name: string;
  usage_count: number;
  interactions: number;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  avg_tokens: number;
}

type SortField = keyof Omit<AgentflowRow, 'name'> | 'name';
type SortDir = 'asc' | 'desc';

interface AgentflowDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  workflowUsage: Record<string, AgentflowUsageDetail>;
}

const i18nPrefix = 'admin.agentflowManagement.userTokenDashboard.modal';

const AgentflowDetailModal: React.FC<AgentflowDetailModalProps> = ({
  isOpen,
  onClose,
  username,
  workflowUsage,
}) => {
  const { t } = useTranslation();
  const [sortField, setSortField] = useState<SortField>('total_tokens');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const rows: AgentflowRow[] = useMemo(() => {
    return Object.entries(workflowUsage).map(([name, detail]) => ({
      name,
      usage_count: detail.usage_count,
      interactions: detail.interactions,
      total_tokens: detail.total_tokens,
      input_tokens: detail.input_tokens,
      output_tokens: detail.output_tokens,
      avg_tokens:
        detail.interactions > 0
          ? Math.round(detail.total_tokens / detail.interactions)
          : 0,
    }));
  }, [workflowUsage]);

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal === bVal) return 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const cmp = aVal.localeCompare(bVal);
        return sortDir === 'asc' ? cmp : -cmp;
      }
      const cmp = (aVal as number) < (bVal as number) ? -1 : 1;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sortField, sortDir]);

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => ({
        usage_count: acc.usage_count + row.usage_count,
        interactions: acc.interactions + row.interactions,
        total_tokens: acc.total_tokens + row.total_tokens,
        input_tokens: acc.input_tokens + row.input_tokens,
        output_tokens: acc.output_tokens + row.output_tokens,
      }),
      {
        usage_count: 0,
        interactions: 0,
        total_tokens: 0,
        input_tokens: 0,
        output_tokens: 0,
      },
    );
  }, [rows]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortHeader: React.FC<{ field: SortField; label: string }> = ({
    field,
    label,
  }) => (
    <th
      className="cursor-pointer select-none px-3 py-2 text-left text-xs font-semibold text-xs text-muted-foreground tracking-wide hover:text-foreground transition-colors"
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortField === field && (
          <span className="text-foreground">
            {sortDir === 'asc' ? '\u25B2' : '\u25BC'}
          </span>
        )}
      </span>
    </th>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t(`${i18nPrefix}.title`)} - ${username}`}
      size="xl"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <SortHeader field="name" label={t(`${i18nPrefix}.workflowName`)} />
              <SortHeader field="usage_count" label={t(`${i18nPrefix}.usageCount`)} />
              <SortHeader field="interactions" label={t(`${i18nPrefix}.totalInteractions`)} />
              <SortHeader field="total_tokens" label={t(`${i18nPrefix}.totalTokens`)} />
              <SortHeader field="input_tokens" label={t(`${i18nPrefix}.inputTokens`)} />
              <SortHeader field="output_tokens" label={t(`${i18nPrefix}.outputTokens`)} />
              <SortHeader field="avg_tokens" label={t(`${i18nPrefix}.avgTokensPerInteraction`)} />
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr
                key={row.name}
                className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors"
              >
                <td className="px-3 py-2 font-medium text-foreground">
                  {row.name}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {t(`${i18nPrefix}.times`, { count: row.usage_count.toLocaleString() })}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {t(`${i18nPrefix}.count`, { count: row.interactions.toLocaleString() })}
                </td>
                <td className="px-3 py-2 font-medium text-foreground">
                  {row.total_tokens.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-primary">
                  {row.input_tokens.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-emerald-500">
                  {row.output_tokens.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {row.avg_tokens.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
        <h4 className="mb-2 text-sm font-semibold text-foreground">
          {t(`${i18nPrefix}.summary.title`)}
        </h4>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <span className="text-muted-foreground">
            {t(`${i18nPrefix}.summary.totalAgentflows`)}
          </span>
          <span className="font-medium text-foreground">
            {rows.length.toLocaleString()}
          </span>
          <span className="text-muted-foreground">
            {t(`${i18nPrefix}.summary.totalUsageCount`)}
          </span>
          <span className="font-medium text-foreground">
            {t(`${i18nPrefix}.times`, { count: summary.usage_count.toLocaleString() })}
          </span>
          <span className="text-muted-foreground">
            {t(`${i18nPrefix}.summary.totalInteractions`)}
          </span>
          <span className="font-medium text-foreground">
            {t(`${i18nPrefix}.count`, { count: summary.interactions.toLocaleString() })}
          </span>
          <span className="text-muted-foreground">
            {t(`${i18nPrefix}.summary.totalTokens`)}
          </span>
          <span className="font-medium text-foreground">
            {summary.total_tokens.toLocaleString()}
          </span>
          <span className="text-muted-foreground">
            {t(`${i18nPrefix}.summary.inputTokens`)}
          </span>
          <span className="font-medium text-primary">
            {summary.input_tokens.toLocaleString()}
          </span>
          <span className="text-muted-foreground">
            {t(`${i18nPrefix}.summary.outputTokens`)}
          </span>
          <span className="font-medium text-emerald-500">
            {summary.output_tokens.toLocaleString()}
          </span>
        </div>
      </div>
    </Modal>
  );
};

export default AgentflowDetailModal;
