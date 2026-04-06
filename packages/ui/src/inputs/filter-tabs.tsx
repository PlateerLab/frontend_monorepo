'use client';

import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../lib/utils';

export interface FilterTab {
  key: string;
  label: string;
  count?: number;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface FilterTabsProps {
  tabs: FilterTab[];
  activeKey: string;
  onChange: (key: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

const containerVariants = cva('flex items-center', {
  variants: {
    variant: {
      default: 'gap-2 bg-[#f3f4f6] rounded-lg p-1 w-fit',
      pills: 'gap-2',
      underline: 'gap-0 border-b border-border',
    },
    size: { sm: 'text-xs', md: 'text-sm', lg: 'text-base' },
  },
  defaultVariants: { variant: 'default', size: 'md' },
});

const tabVariants = cva(
  'inline-flex items-center justify-center gap-1.5 font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'rounded-md px-4 py-2 text-sm',
        pills: 'rounded-full px-4 py-1.5',
        underline: 'px-4 py-2 border-b-2 border-transparent -mb-px',
      },
      active: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      { variant: 'default', active: true, className: 'bg-white text-[#2563eb] shadow-[0_1px_3px_rgba(0,0,0,0.1)]' },
      { variant: 'default', active: false, className: 'text-[#374151] hover:bg-white hover:text-[#111827]' },
      { variant: 'pills', active: true, className: 'bg-primary text-white' },
      { variant: 'pills', active: false, className: 'text-muted-foreground hover:bg-accent' },
      { variant: 'underline', active: true, className: 'border-gray-510 text-gray-510' },
      { variant: 'underline', active: false, className: 'text-muted-foreground hover:text-foreground hover:border-gray-300' },
    ],
    defaultVariants: { variant: 'default', active: false },
  }
);

export const FilterTabs: React.FC<FilterTabsProps> = ({
  tabs, activeKey, onChange, variant = 'default', size = 'md', fullWidth = false, className,
}) => {
  return (
    <div className={cn(containerVariants({ variant, size }), fullWidth && 'w-full', className)} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.key} type="button" role="tab"
          aria-selected={activeKey === tab.key}
          disabled={tab.disabled}
          onClick={() => onChange(tab.key)}
          className={cn(tabVariants({ variant, active: activeKey === tab.key }), fullWidth && 'flex-1')}
        >
          {tab.icon && <span className="shrink-0">{tab.icon}</span>}
          <span>{tab.label}</span>
          {tab.count !== undefined && (
            <span className={cn(
              'inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-xs',
              activeKey === tab.key ? 'bg-white/20 text-current' : 'bg-gray-200 text-muted-foreground'
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default FilterTabs;
