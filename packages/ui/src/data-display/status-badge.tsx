'use client';

import React from 'react';
import { cn } from '../lib/utils';

export type StatusBadgeVariant =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral';

export interface StatusBadgeProps {
  children: React.ReactNode;
  variant?: StatusBadgeVariant;
  className?: string;
  /** 점(dot) 표시 여부 */
  dot?: boolean;
}

const variantStyles: Record<StatusBadgeVariant, string> = {
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  error:   'bg-error/10 text-error border-error/20',
  info:    'bg-info/10 text-info border-info/20',
  neutral: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700',
};

const dotStyles: Record<StatusBadgeVariant, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  error:   'bg-error',
  info:    'bg-info',
  neutral: 'bg-gray-400',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  children,
  variant = 'neutral',
  className,
  dot = true,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className,
      )}
    >
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full', dotStyles[variant])}
        />
      )}
      {children}
    </span>
  );
};

export default StatusBadge;
