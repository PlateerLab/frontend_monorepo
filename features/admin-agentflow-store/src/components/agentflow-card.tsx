'use client';

import React from 'react';
import { StatusBadge, Button } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { FiSettings, FiTrash2, FiCheck, FiX, FiUser, FiUsers } from '@xgen/icons';
import type { Agentflow } from '../types';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const NS = 'admin.agentflowManagement.agentflowStore';

export function getAgentflowState(
  agentflow: Agentflow,
): 'active' | 'inactive' {
  if (
    agentflow.has_startnode &&
    agentflow.has_endnode &&
    agentflow.node_count >= 3 &&
    agentflow.is_completed
  ) {
    return 'active';
  }
  return 'inactive';
}

export function isAgentflowDeployPending(agentflow: Agentflow): boolean {
  return Boolean(agentflow.inquire_deploy);
}

export function isAgentflowDeployed(agentflow: Agentflow): boolean {
  return Boolean(agentflow.is_deployed ?? agentflow.enable_deploy);
}

export function formatCompactDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}.${mm}.${dd}`;
  } catch {
    return dateStr;
  }
}

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────

export interface AgentflowCardProps {
  agentflow: Agentflow;
  onClick?: () => void;
  onSettings?: () => void;
  onDelete?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export const AgentflowCard: React.FC<AgentflowCardProps> = ({
  agentflow,
  onClick,
  onSettings,
  onDelete,
  onApprove,
  onReject,
}) => {
  const { t } = useTranslation();

  const state = getAgentflowState(agentflow);
  const deployPending = isAgentflowDeployPending(agentflow);
  const deployed = isAgentflowDeployed(agentflow);
  const isPrivate = !agentflow.is_shared;
  const ownerName = agentflow.username || agentflow.full_name || t(`${NS}.card.unknownOwner`);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.();
      }}
      className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md cursor-pointer"
    >
      {/* Badge row */}
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge variant={state === 'active' ? 'success' : 'error'}>
          {state === 'active'
            ? t(`${NS}.filter.active`)
            : t(`${NS}.filter.inactive`)}
        </StatusBadge>

        {isPrivate && (
          <StatusBadge variant="neutral">
            {t(`${NS}.card.private`)}
          </StatusBadge>
        )}

        <StatusBadge variant={deployed ? 'success' : 'neutral'}>
          {deployed
            ? t(`${NS}.card.deployed`)
            : t(`${NS}.card.notDeployed`)}
        </StatusBadge>
      </div>

      {/* Title row */}
      <div className="flex items-center gap-2 min-w-0">
        {agentflow.is_shared ? (
          <FiUsers className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <FiUser className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="truncate text-sm font-semibold text-foreground">
          {agentflow.workflow_upload_name}
        </span>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>{ownerName}</span>
        <span>{formatCompactDate(agentflow.updated_at || agentflow.created_at)}</span>
        <span>
          {t(`${NS}.card.nodes`)}: {agentflow.node_count}
        </span>
      </div>

      {/* Actions row */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border">
        {/* Left: Settings + Delete */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSettings?.();
            }}
            title={t(`${NS}.card.settings`)}
          >
            <FiSettings className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            title={t(`${NS}.card.delete`)}
          >
            <FiTrash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Right: Deploy Approve / Reject (only when pending) */}
        {deployPending && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-emerald-600 hover:text-emerald-700"
              onClick={(e) => {
                e.stopPropagation();
                onApprove?.();
              }}
              title={t(`${NS}.card.approve`)}
            >
              <FiCheck className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                onReject?.();
              }}
              title={t(`${NS}.card.reject`)}
            >
              <FiX className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentflowCard;
