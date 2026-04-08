'use client';

import React from 'react';
import { StatusBadge, Button } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { FiCopy, FiEdit, FiTrash2, FiUser, FiCalendar } from '@xgen/icons';
import type { Prompt } from '../types';

const PS = 'admin.agentflowManagement.promptStore';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

interface PromptCardProps {
  prompt: Prompt;
  onCopy: (prompt: Prompt) => void;
  onEdit: (prompt: Prompt) => void;
  onDelete: (prompt: Prompt) => void;
  onClick: (prompt: Prompt) => void;
}

const PromptCard: React.FC<PromptCardProps> = ({
  prompt,
  onCopy,
  onEdit,
  onDelete,
  onClick,
}) => {
  const { t } = useTranslation();

  const truncatedContent =
    prompt.prompt_content.length > 50
      ? `${prompt.prompt_content.slice(0, 50)}...`
      : prompt.prompt_content;

  return (
    <div
      className="flex cursor-pointer flex-col justify-between rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md"
      onClick={() => onClick(prompt)}
    >
      {/* Header */}
      <div>
        <h3 className="mb-2 truncate text-sm font-semibold text-foreground" title={prompt.prompt_title}>
          {prompt.prompt_title}
        </h3>

        {/* Badges */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          <StatusBadge variant="info" dot={false}>
            {prompt.language.toUpperCase()}
          </StatusBadge>
          <StatusBadge
            variant={prompt.prompt_type === 'system' ? 'warning' : 'neutral'}
            dot={false}
          >
            {prompt.prompt_type}
          </StatusBadge>
          {prompt.is_template && (
            <StatusBadge variant="success" dot={false}>
              {t(`${PS}.card.template`)}
            </StatusBadge>
          )}
          <StatusBadge
            variant={prompt.public_available ? 'success' : 'neutral'}
            dot={false}
          >
            {prompt.public_available
              ? t(`${PS}.card.public`)
              : t(`${PS}.card.private`)}
          </StatusBadge>
        </div>

        {/* Content preview */}
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
          {truncatedContent}
        </p>
      </div>

      {/* Meta */}
      <div className="mb-3 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <FiCalendar className="h-3 w-3" />
          {formatDate(prompt.created_at)}
        </span>
        {prompt.username && (
          <span className="flex items-center gap-1">
            <FiUser className="h-3 w-3" />
            {prompt.username}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="text-[11px] text-muted-foreground">
          {t(`${PS}.card.charCount`)}: {prompt.prompt_content.length}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onCopy(prompt);
            }}
            title={t(`${PS}.card.copy`)}
          >
            <FiCopy className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(prompt);
            }}
            title={t(`${PS}.card.edit`)}
          >
            <FiEdit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(prompt);
            }}
            title={t(`${PS}.card.delete`)}
          >
            <FiTrash2 className="h-3.5 w-3.5 text-red-500" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PromptCard;
