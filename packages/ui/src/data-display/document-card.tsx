'use client';

import React from 'react';
import { cn } from '../lib/utils';

// ─────────────────────────────────────────────────────────────
// Icons (inline SVG — no external dependency)
// ─────────────────────────────────────────────────────────────

const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
  </svg>
);

const FolderIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const FileIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type DocumentCardVariant = 'file' | 'folder' | 'parent';

export interface DocumentCardAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  /** hover 시에만 표시 (기본: false) */
  hoverOnly?: boolean;
}

export interface DocumentCardMeta {
  icon?: React.ReactNode;
  value: string;
}

export interface DocumentCardHoverAction {
  id: string;
  icon: React.ReactNode;
  onClick: () => void;
  title?: string;
}

export interface DocumentCardProps {
  variant: DocumentCardVariant;
  title: string;
  subtitle?: string;
  metadata?: DocumentCardMeta[];
  actions?: DocumentCardAction[];
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  /** hover 시에만 보이는 삭제 버튼 (단축) */
  onDelete?: () => void;
  /** hover 시에만 보이는 아이콘 버튼들 */
  hoverActions?: DocumentCardHoverAction[];
}

// ─────────────────────────────────────────────────────────────
// Variant config
// ─────────────────────────────────────────────────────────────

const variantConfig: Record<DocumentCardVariant, {
  bg: string;
  color: string;
  icon: React.ReactNode;
}> = {
  file: {
    bg: 'rgba(249, 115, 22, 0.08)',
    color: '#f97316',
    icon: <FileIcon />,
  },
  folder: {
    bg: 'rgba(59, 130, 246, 0.08)',
    color: '#3b82f6',
    icon: <FolderIcon />,
  },
  parent: {
    bg: 'rgba(107, 114, 128, 0.06)',
    color: '#6b7280',
    icon: <ArrowLeftIcon />,
  },
};

// ─────────────────────────────────────────────────────────────
// File extension color map
// ─────────────────────────────────────────────────────────────

const extColorMap: Record<string, { bg: string; text: string }> = {
  pdf:  { bg: 'rgba(239, 68, 68, 0.08)',   text: '#ef4444' },
  doc:  { bg: 'rgba(59, 130, 246, 0.08)',  text: '#3b82f6' },
  docx: { bg: 'rgba(59, 130, 246, 0.08)',  text: '#3b82f6' },
  xls:  { bg: 'rgba(34, 197, 94, 0.08)',   text: '#22c55e' },
  xlsx: { bg: 'rgba(34, 197, 94, 0.08)',   text: '#22c55e' },
  ppt:  { bg: 'rgba(249, 115, 22, 0.08)',  text: '#f97316' },
  pptx: { bg: 'rgba(249, 115, 22, 0.08)',  text: '#f97316' },
  txt:  { bg: 'rgba(107, 114, 128, 0.08)', text: '#6b7280' },
  md:   { bg: 'rgba(107, 114, 128, 0.08)', text: '#6b7280' },
  csv:  { bg: 'rgba(34, 197, 94, 0.08)',   text: '#22c55e' },
  json: { bg: 'rgba(234, 179, 8, 0.08)',   text: '#eab308' },
  hwp:  { bg: 'rgba(59, 130, 246, 0.08)',  text: '#3b82f6' },
  jpg:  { bg: 'rgba(236, 72, 153, 0.08)',  text: '#ec4899' },
  jpeg: { bg: 'rgba(236, 72, 153, 0.08)',  text: '#ec4899' },
  png:  { bg: 'rgba(236, 72, 153, 0.08)',  text: '#ec4899' },
};

function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export const DocumentCard: React.FC<DocumentCardProps> = ({
  variant,
  title,
  subtitle,
  metadata,
  actions,
  onClick,
  className,
  icon,
  iconBg,
  iconColor,
  onDelete,
  hoverActions,
}) => {
  const config = variantConfig[variant];
  const ext = variant === 'file' ? getFileExtension(title) : '';
  const extColors = ext ? extColorMap[ext] : undefined;

  const handleActionClick = (action: DocumentCardAction, e: React.MouseEvent) => {
    e.stopPropagation();
    action.onClick();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  // ── Parent variant: compact single-row ──
  if (variant === 'parent') {
    return (
      <div
        className={cn(
          'group flex items-center gap-3 p-4 bg-card border border-border rounded-lg',
          'cursor-pointer hover:shadow-sm hover:bg-accent/30 transition-all',
          className,
        )}
        onClick={onClick}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: config.bg, color: config.color }}
        >
          {icon || config.icon}
        </div>
        <span className="text-sm text-muted-foreground">..</span>
      </div>
    );
  }

  // ── Folder variant: single-row with hover delete ──
  if (variant === 'folder') {
    return (
      <div
        className={cn(
          'group flex items-center gap-3 p-4 bg-card border border-border rounded-lg',
          onClick && 'cursor-pointer hover:shadow-sm transition-all',
          className,
        )}
        onClick={onClick}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{
            backgroundColor: iconBg || config.bg,
            color: iconColor || config.color,
          }}
        >
          {icon || config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{title}</p>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
        {onDelete && (
          <button
            className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
            onClick={handleDelete}
          >
            <TrashIcon />
          </button>
        )}
        {/* Fallback: actions as bottom bar (if no onDelete) */}
        {!onDelete && actions && actions.length > 0 && (
          <div className="flex items-center gap-1.5">
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                onClick={(e) => handleActionClick(action, e)}
              >
                {action.icon || <TrashIcon />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── File variant: multi-row card ──
  return (
    <div
      className={cn(
        'group flex flex-col p-4 bg-card border border-border rounded-lg transition-all',
        onClick && 'cursor-pointer hover:shadow-sm',
        className,
      )}
      onClick={onClick}
    >
      {/* Row 1: Icon + Title + Hover Actions */}
      <div className="flex items-start gap-3 mb-2">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{
            backgroundColor: iconBg || extColors?.bg || config.bg,
            color: iconColor || extColors?.text || config.color,
          }}
        >
          {icon || config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{title}</p>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {(onDelete || hoverActions) && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
            {hoverActions?.map((ha) => (
              <button
                key={ha.id}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                title={ha.title}
                onClick={(e) => { e.stopPropagation(); ha.onClick(); }}
              >
                {ha.icon}
              </button>
            ))}
            {onDelete && (
              <button
                className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                onClick={handleDelete}
              >
                <TrashIcon />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Row 2: Extension badge + Metadata */}
      {(ext || (metadata && metadata.length > 0)) && (
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-auto">
          {ext && (
            <span className="uppercase font-medium">{ext}</span>
          )}
          {metadata?.map((meta, index) => (
            <span key={index} className="flex items-center gap-1">
              {meta.icon}
              <span>{meta.value}</span>
            </span>
          ))}
        </div>
      )}

      {/* Row 3: Action buttons (다운로드, 삭제 등) — only if actions provided */}
      {actions && actions.length > 0 && (
        <div
          data-card-actions
          className="flex items-center gap-1.5 pt-3 border-t border-[var(--color-line-50)] mt-3"
        >
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium',
                'border border-gray-200 bg-gray-50/60 text-muted-foreground',
                'hover:text-foreground hover:bg-gray-100 hover:border-gray-300 transition-colors',
                action.danger && 'hover:text-error hover:border-error/30 hover:bg-error/5',
              )}
              onClick={(e) => handleActionClick(action, e)}
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentCard;
