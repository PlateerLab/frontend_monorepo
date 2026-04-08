'use client';

import React from 'react';
import { Modal, StatusBadge, Button, useToast } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { FiCopy } from '@xgen/icons';
import type { Prompt } from '../types';

const PS = 'admin.agentflowManagement.promptStore';
const EX = `${PS}.expandModal`;

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

interface PromptExpandModalProps {
  isOpen: boolean;
  prompt: Prompt;
  onClose: () => void;
}

const PromptExpandModal: React.FC<PromptExpandModalProps> = ({
  isOpen,
  prompt,
  onClose,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.prompt_content);
      toast.success(t(`${PS}.toast.copySuccess`));
    } catch {
      // Fallback ignored
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={prompt.prompt_title}
      size="lg"
      footer={
        <Button variant="outline" onClick={onClose}>
          {t(`${EX}.close`)}
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <StatusBadge variant="info" dot={false}>
            {prompt.language.toUpperCase()}
          </StatusBadge>
          {prompt.is_template && (
            <StatusBadge variant="success" dot={false}>
              {t(`${EX}.template`)}
            </StatusBadge>
          )}
          <StatusBadge
            variant={prompt.public_available ? 'success' : 'neutral'}
            dot={false}
          >
            {prompt.public_available
              ? t(`${EX}.public`)
              : t(`${EX}.private`)}
          </StatusBadge>
        </div>

        {/* Prompt content */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">
              {t(`${EX}.promptContent`)}
            </h4>
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              <FiCopy className="mr-1 h-3.5 w-3.5" />
              {t(`${EX}.copy`)}
            </Button>
          </div>
          <div className="max-h-[300px] overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-muted/50 p-4 font-mono text-sm leading-relaxed text-foreground">
            {prompt.prompt_content}
          </div>
        </div>

        {/* Detail info grid */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">
            {t(`${EX}.detailInfo`)}
          </h4>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-md border border-border bg-muted/50 p-4 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">
                {t(`${EX}.userId`)}
              </span>
              <p className="font-medium text-foreground">
                {prompt.user_id || '-'}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                {t(`${EX}.username`)}
              </span>
              <p className="font-medium text-foreground">
                {prompt.username || '-'}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                {t(`${EX}.fullName`)}
              </span>
              <p className="font-medium text-foreground">
                {prompt.full_name || '-'}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                {t(`${EX}.createdAt`)}
              </span>
              <p className="font-medium text-foreground">
                {formatDateTime(prompt.created_at)}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                {t(`${EX}.updatedAt`)}
              </span>
              <p className="font-medium text-foreground">
                {formatDateTime(prompt.updated_at)}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                {t(`${EX}.charCount`)}
              </span>
              <p className="font-medium text-foreground">
                {prompt.prompt_content.length}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                {t(`${EX}.template`)}
              </span>
              <p className="font-medium text-foreground">
                {prompt.is_template ? t(`${EX}.yes`) : t(`${EX}.no`)}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                {t(`${EX}.public`)}
              </span>
              <p className="font-medium text-foreground">
                {prompt.public_available ? t(`${EX}.yes`) : t(`${EX}.no`)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PromptExpandModal;
