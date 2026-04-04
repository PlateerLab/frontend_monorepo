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
  /** 아이콘 (deprecated — 무시됨) */
  icon?: React.ReactNode;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Variant → value colour mapping                                     */
/* ------------------------------------------------------------------ */

const VARIANT_VALUE_CLASS: Record<StatCardVariant, string> = {
  default:  'text-foreground',
  info:     'text-foreground',
  success:  'text-foreground',
  warning:  'text-foreground',
  error:    'text-foreground',
  critical: 'text-foreground',
  neutral:  'text-foreground',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  variant = 'default',
  subtitle,
  selected = false,
  onClick,
  loading = false,
  className,
}) => {
  const isClickable = !!onClick;

  return (
    <div
      className={cn(
        'rounded-xl border border-gray-300 bg-card px-5 py-4 transition-all duration-150',
        selected && 'border-primary/60 shadow-sm',
        isClickable && 'cursor-pointer hover:shadow-sm hover:border-gray-400',
        className,
      )}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } } : undefined}
    >
      <p className="text-xs font-medium text-muted-foreground truncate">
        {label}
      </p>
      <p className={cn('text-2xl font-bold mt-1 leading-tight', VARIANT_VALUE_CLASS[variant])}>
        {loading ? '—' : value}
      </p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      )}
    </div>
  );
};

export default StatCard;
