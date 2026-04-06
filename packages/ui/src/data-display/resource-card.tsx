'use client';

import React, { useCallback } from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import type {
  ResourceCardProps,
  CardBadge,
  CardMetaItem,
  CardActionButton,
  CardDropdownItem,
  CardThumbnail,
} from '@xgen/types';
import { cn } from '../lib/utils';

const MoreIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="3" r="1.5" fill="currentColor" />
    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
    <circle cx="8" cy="13" r="1.5" fill="currentColor" />
  </svg>
);

const FolderIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 5.83333V14.1667C2.5 15.0871 3.24619 15.8333 4.16667 15.8333H15.8333C16.7538 15.8333 17.5 15.0871 17.5 14.1667V7.5C17.5 6.57953 16.7538 5.83333 15.8333 5.83333H10L8.33333 4.16667H4.16667C3.24619 4.16667 2.5 4.91286 2.5 5.83333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const badgeVariantClasses: Record<string, string> = {
  success: 'bg-success/5 text-success border border-success/20',
  warning: 'bg-warning/5 text-warning border border-warning/20',
  error: 'bg-error/5 text-error border border-error/20',
  info: 'bg-info/5 text-info border border-info/20',
  default: 'bg-gray-50 text-gray-500 border border-gray-200',
  secondary: 'bg-gray-50 text-gray-500 border border-gray-200',
  primary: 'bg-primary/5 text-primary border border-primary/20',
  purple: 'bg-purple-50 text-purple-600 border border-purple-200',
};

export function ResourceCard<T = unknown>({
  id,
  data,
  title,
  description,
  errorMessage,
  thumbnail,
  badges,
  metadata,
  primaryActions,
  dropdownActions,
  selectable,
  selected,
  onClick,
  onDoubleClick,
  onSelect,
  inactive,
  inactiveMessage,
  className,
}: ResourceCardProps<T>): React.ReactElement {

  // ── Card-level click ──
  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-card-actions]') || target.closest('[data-card-checkbox]')) return;
      if (selectable && onSelect) {
        onSelect(id, !selected);
      } else if (onClick) {
        onClick(data);
      }
    },
    [id, data, selectable, selected, onClick, onSelect],
  );

  // ── Card-level double-click ──
  const handleCardDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (inactive || selectable) return;
      const target = e.target as HTMLElement;
      if (target.closest('[data-card-actions]')) return;
      if (onDoubleClick) {
        e.preventDefault();
        e.stopPropagation();
        onDoubleClick(data);
      }
    },
    [data, inactive, selectable, onDoubleClick],
  );

  // ── Action button click ──
  const handleActionClick = useCallback(
    (action: CardActionButton, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!action.disabled) action.onClick();
    },
    [],
  );

  const renderThumbnail = () => {
    if (!thumbnail) {
      return (
        <div className="flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground shrink-0">
          <FolderIcon />
        </div>
      );
    }

    return (
      <div
        className="flex items-center justify-center h-6 w-6 rounded-md overflow-hidden shrink-0"
        style={{
          backgroundColor: thumbnail.backgroundColor || undefined,
          color: thumbnail.iconColor || undefined,
        }}
      >
        {thumbnail.imageUrl ? (
          <img src={thumbnail.imageUrl} alt={title} className="w-full h-full object-cover" />
        ) : thumbnail.icon ? (
          thumbnail.icon
        ) : (
          <FolderIcon />
        )}
      </div>
    );
  };

  const renderBadges = () => {
    if (!badges || badges.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1">
        {badges.map((badge, index) => (
          <span
            key={`${badge.text}-${index}`}
            className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium', badgeVariantClasses[badge.variant] || badgeVariantClasses.default)}
            title={badge.tooltip}
          >
            {badge.text}
          </span>
        ))}
      </div>
    );
  };

  const renderMetadata = () => {
    if (!metadata || metadata.length === 0) return null;
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
        {metadata.map((meta, index) => (
          <React.Fragment key={index}>
            {index > 0 && <span className="text-gray-300">·</span>}
            <span className="flex items-center gap-1" title={meta.tooltip || String(meta.value)}>
              {meta.icon}
              {meta.label && <span>{meta.label}:</span>}
              <span>{meta.value}</span>
            </span>
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderActions = () => {
    if (inactive) {
      return (
        <div data-card-actions className="pt-3 border-t border-[var(--color-line-50)] mt-3">
          <div className="text-xs text-muted-foreground italic">{inactiveMessage || '비활성 상태'}</div>
        </div>
      );
    }

    const hasPrimary = primaryActions && primaryActions.length > 0;
    const hasDropdown = dropdownActions && dropdownActions.length > 0;
    if (!hasPrimary && !hasDropdown) return null;

    return (
      <div data-card-actions className="flex items-center justify-between pt-3 border-t border-[var(--color-line-50)] mt-3">
        <div className="flex items-center gap-1.5">
          {primaryActions?.map((action) => (
            <button
              key={action.id}
              type="button"
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium',
                'border border-gray-200 bg-gray-50/60 text-muted-foreground',
                'hover:text-foreground hover:bg-gray-100 hover:border-gray-300 transition-colors',
                action.disabled && 'opacity-40 cursor-not-allowed',
              )}
              title={action.disabled ? action.disabledMessage : action.label}
              disabled={action.disabled}
              onClick={(e) => handleActionClick(action, e)}
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center">
          {hasDropdown && (
            <DropdownMenuPrimitive.Root>
              <DropdownMenuPrimitive.Trigger asChild>
                <button
                  type="button"
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors"
                  title="더보기"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreIcon />
                </button>
              </DropdownMenuPrimitive.Trigger>

              <DropdownMenuPrimitive.Portal>
                <DropdownMenuPrimitive.Content
                  side="top"
                  align="end"
                  sideOffset={4}
                  className="z-50 min-w-[160px] rounded-md border border-[var(--color-line-50)] bg-white shadow-lg py-1 animate-in fade-in-0 zoom-in-95"
                  onClick={(e) => e.stopPropagation()}
                >
                  {dropdownActions!.map((item, index) => (
                    <React.Fragment key={item.id}>
                      {item.dividerBefore && index > 0 && (
                        <DropdownMenuPrimitive.Separator className="h-px bg-border my-1" />
                      )}
                      <DropdownMenuPrimitive.Item
                        disabled={item.disabled}
                        onSelect={() => {
                          if (!item.disabled) item.onClick();
                        }}
                        className={cn(
                          'flex items-center gap-2 px-3 py-1.5 text-sm outline-none cursor-pointer transition-colors',
                          item.danger
                            ? 'text-error focus:bg-error/5'
                            : 'text-foreground focus:bg-gray-50',
                          item.disabled && 'opacity-50 cursor-not-allowed',
                        )}
                      >
                        {item.icon && <span className="w-4 h-4 shrink-0">{item.icon}</span>}
                        <span>{item.label}</span>
                      </DropdownMenuPrimitive.Item>
                    </React.Fragment>
                  ))}
                </DropdownMenuPrimitive.Content>
              </DropdownMenuPrimitive.Portal>
            </DropdownMenuPrimitive.Root>
          )}
        </div>
      </div>
    );
  };

  const isClickable = onClick || (selectable && onSelect);

  return (
    <div
      className={cn(
        'relative rounded-xl border border-[var(--color-line-50)] bg-card p-4 transition-all',
        selected && 'ring-2 ring-primary border-primary',
        isClickable && 'cursor-pointer hover:shadow-md',
        inactive && 'opacity-60',
        className,
      )}
      onClick={handleCardClick}
      onDoubleClick={handleCardDoubleClick}
      data-card-id={id}
    >
      {selectable && (
        <div data-card-checkbox className="absolute top-3 right-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect?.(id, !selected)}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
        </div>
      )}

      {/* Badges row */}
      {renderBadges()}

      {/* Title with thumbnail */}
      <div className="flex items-center gap-2.5 mt-2.5 mb-1.5">
        {renderThumbnail()}
        <h3 className="text-sm font-semibold text-foreground line-clamp-1" title={title}>{title}</h3>
      </div>

      {/* Description */}
      {description && <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{description}</p>}
      {errorMessage && <p className="text-xs text-error mb-1">오류: {errorMessage}</p>}

      {/* Metadata */}
      {renderMetadata()}

      {renderActions()}
    </div>
  );
}

export default ResourceCard;

export type {
  ResourceCardProps,
  CardBadge,
  CardMetaItem,
  CardActionButton,
  CardDropdownItem,
  CardThumbnail,
} from '@xgen/types';
