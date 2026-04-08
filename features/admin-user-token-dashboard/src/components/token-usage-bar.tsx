'use client';

import React from 'react';
import { useTranslation } from '@xgen/i18n';

interface TokenUsageBarProps {
  inputTokens: number;
  outputTokens: number;
  maxTokens: number;
}

const i18nPrefix = 'admin.agentflowManagement.userTokenDashboard';

const TokenUsageBar: React.FC<TokenUsageBarProps> = ({
  inputTokens,
  outputTokens,
  maxTokens,
}) => {
  const { t } = useTranslation();

  if (maxTokens === 0) {
    return <div className="h-4 w-full rounded bg-muted" />;
  }

  const total = inputTokens + outputTokens;
  const totalWidth = (total / maxTokens) * 100;
  const inputWidth = total > 0 ? (inputTokens / total) * 100 : 0;
  const outputWidth = total > 0 ? (outputTokens / total) * 100 : 0;

  return (
    <div className="flex flex-col gap-1">
      <div className="h-4 w-full rounded bg-muted overflow-hidden">
        <div
          className="flex h-full rounded"
          style={{ width: `${Math.min(totalWidth, 100)}%` }}
        >
          <div
            className="h-full bg-primary/70"
            style={{ width: `${inputWidth}%` }}
            title={`${t(`${i18nPrefix}.inputTokens`)}: ${inputTokens.toLocaleString('ko-KR')}`}
          />
          <div
            className="h-full bg-emerald-500"
            style={{ width: `${outputWidth}%` }}
            title={`${t(`${i18nPrefix}.outputTokens`)}: ${outputTokens.toLocaleString('ko-KR')}`}
          />
        </div>
      </div>
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-primary/70" />
          {t(`${i18nPrefix}.inputTokens`)}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          {t(`${i18nPrefix}.outputTokens`)}
        </span>
      </div>
    </div>
  );
};

export default TokenUsageBar;
