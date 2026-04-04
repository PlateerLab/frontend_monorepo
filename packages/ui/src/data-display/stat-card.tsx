'use client';

import React from 'react';
import { cn } from '../lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type StatCardVariant =
  | 'default'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'critical'
  | 'neutral';

export interface StatCardProps {
  /** 카드 라벨 */
  label: string;
  /** 표시할 값 */
  value: string | number | React.ReactNode;
  /** 미리 정의된 accent 색상 변형 */
  variant?: StatCardVariant;
  /** 커스텀 accent 색상 (hex / css) — variant 보다 우선 */
  accentColor?: string;
  /** 값 아래 보조 텍스트 (ex: "/ 100 total") */
  subtitle?: string;
  /** 선택(활성) 상태 */
  selected?: boolean;
  /** 클릭 핸들러 */
  onClick?: () => void;
  /** 로딩 상태 — 값 대신 placeholder 표시 */
  loading?: boolean;
  /** 아이콘 */
  icon?: React.ReactNode;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Variant → colour mapping                                           */
/* ------------------------------------------------------------------ */

const VARIANT_ACCENT: Record<StatCardVariant, string> = {
  default:  'var(--color-info, #305eeb)',
  info:     'var(--color-info, #305eeb)',
  success:  'var(--color-success, #2eb146)',
  warning:  'var(--color-warning, #f59f00)',
  error:    'var(--color-error, #e03131)',
  critical: '#dc2626',
  neutral:  'var(--color-gray-400, #abb1ba)',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  variant = 'default',
  accentColor,
  subtitle,
  selected = false,
  onClick,
  loading = false,
  icon,
  className,
}) => {
  const color = accentColor || VARIANT_ACCENT[variant];
  const isNeutral = variant === 'neutral' && !accentColor;
  const isClickable = !!onClick;

  return (
    <div
      className={cn(
        'relative rounded-xl border bg-card p-4 transition-all duration-200',
        selected
          ? 'border-primary ring-1 ring-primary/30'
          : 'border-border',
        isClickable && 'cursor-pointer hover:shadow-md hover:border-primary/40',
        className,
      )}
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } } : undefined}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`, color }}
          >
            {icon}
          </div>
        )}
        <div className="flex flex-col gap-0.5 min-w-0">
          <p
            className="text-xs font-medium truncate"
            style={{ color: isNeutral ? undefined : color }}
          >
            {label}
          </p>
          <p
            className={cn(
              'text-2xl font-bold leading-tight',
              isNeutral && 'text-foreground',
            )}
            style={isNeutral ? undefined : { color }}
          >
            {loading ? '—' : value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
