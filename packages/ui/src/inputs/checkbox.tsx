'use client';

import React, { useId } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';
import { LuCheck } from '@xgen/icons';

// ── Variants ───────────────────────────────────────────────────

const checkboxBox = cva(
  'inline-flex items-center justify-center shrink-0 rounded border-2 transition-all duration-150 cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-3.5 w-3.5 rounded-[3px] [&_svg]:w-2.5 [&_svg]:h-2.5',
        md: 'h-4 w-4 rounded-[3px] [&_svg]:w-3 [&_svg]:h-3',
        lg: 'h-5 w-5 rounded [&_svg]:w-3.5 [&_svg]:h-3.5',
      },
      checked: {
        true: 'bg-primary border-primary text-white',
        false: 'bg-white border-[var(--color-line-50)] hover:border-[var(--color-gray-400)]',
      },
    },
    defaultVariants: { size: 'md', checked: false },
  },
);

const checkboxLabel = cva(
  'cursor-pointer select-none text-[var(--color-gray-600)] peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'text-[11px]',
        md: 'text-xs',
        lg: 'text-sm',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

// ── Component ──────────────────────────────────────────────────

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  labelPosition?: 'left' | 'right';
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  name?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  labelPosition = 'right',
  disabled = false,
  size = 'md',
  className,
  name,
}) => {
  const id = useId();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  const box = (
    <span className={checkboxBox({ size, checked })}>
      {checked && <LuCheck strokeWidth={3} />}
    </span>
  );

  return (
    <label
      htmlFor={id}
      className={cn(
        'inline-flex items-center gap-1.5',
        disabled && 'opacity-50 pointer-events-none',
        className,
      )}
    >
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className="peer sr-only"
      />
      {label && labelPosition === 'left' && (
        <span className={checkboxLabel({ size })}>{label}</span>
      )}
      {box}
      {label && labelPosition === 'right' && (
        <span className={checkboxLabel({ size })}>{label}</span>
      )}
    </label>
  );
};
