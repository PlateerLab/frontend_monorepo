'use client';

import React, { useId } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../lib/utils';

// ── Track ──────────────────────────────────────────────────────

const switchTrack = cva(
  'relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-within:ring-2 focus-within:ring-offset-2',
  {
    variants: {
      size: {
        sm: 'h-5 w-9',
        md: 'h-6 w-11',
        lg: 'h-7 w-[52px]',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

const trackColorOn: Record<string, string> = {
  primary: 'bg-primary focus-within:ring-primary/30',
  green: 'bg-emerald-500 focus-within:ring-emerald-500/30',
  red: 'bg-red-400 focus-within:ring-red-400/30',
  teal: 'bg-teal-400 focus-within:ring-teal-400/30',
  gray: 'bg-[var(--color-gray-500)] focus-within:ring-gray-400/30',
};

const trackColorOff = 'bg-gray-300';

// ── Knob ───────────────────────────────────────────────────────

const switchKnob = cva(
  'pointer-events-none absolute rounded-full bg-white shadow-sm transition-transform duration-200',
  {
    variants: {
      size: {
        sm: 'h-3.5 w-3.5 top-[3px]',
        md: 'h-4.5 w-4.5 top-[3px]',
        lg: 'h-5 w-5 top-1',
      },
      checked: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      { size: 'sm', checked: false, class: 'left-[3px]' },
      { size: 'sm', checked: true, class: 'left-[19px]' },
      { size: 'md', checked: false, class: 'left-[3px]' },
      { size: 'md', checked: true, class: 'left-[23px]' },
      { size: 'lg', checked: false, class: 'left-1' },
      { size: 'lg', checked: true, class: 'left-[27px]' },
    ],
    defaultVariants: { size: 'md', checked: false },
  },
);

// ── Label ──────────────────────────────────────────────────────

const switchLabel = cva(
  'cursor-pointer select-none font-bold uppercase tracking-wide',
  {
    variants: {
      size: {
        sm: 'text-[10px]',
        md: 'text-[11px]',
        lg: 'text-xs',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

// ── Component ──────────────────────────────────────────────────

export type ToggleSwitchColor = 'primary' | 'green' | 'red' | 'teal' | 'gray';

export interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  labelPosition?: 'left' | 'right';
  showStateLabel?: boolean;
  onLabel?: string;
  offLabel?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: ToggleSwitchColor;
  className?: string;
  name?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  labelPosition = 'right',
  showStateLabel = false,
  onLabel = 'ON',
  offLabel = 'OFF',
  disabled = false,
  size = 'md',
  color = 'primary',
  className,
  name,
}) => {
  const id = useId();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  const stateLabel = showStateLabel ? (
    <span
      className={cn(
        switchLabel({ size }),
        checked ? (trackColorOn[color]?.replace(/bg-/, 'text-').replace(/ focus.*$/, '') || 'text-primary') : 'text-gray-400',
      )}
    >
      {checked ? onLabel : offLabel}
    </span>
  ) : null;

  const track = (
    <div
      className={cn(
        switchTrack({ size }),
        checked ? trackColorOn[color] : trackColorOff,
      )}
    >
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className="sr-only"
        role="switch"
        aria-checked={checked}
      />
      <span className={switchKnob({ size, checked })} />
    </div>
  );

  const textLabel = label ? (
    <span className="text-sm text-[var(--color-gray-600)] cursor-pointer select-none">
      {label}
    </span>
  ) : null;

  return (
    <label
      htmlFor={id}
      className={cn(
        'inline-flex items-center gap-2',
        disabled && 'opacity-50 pointer-events-none',
        className,
      )}
    >
      {textLabel && labelPosition === 'left' && textLabel}
      {stateLabel && <span className="min-w-[26px]">{stateLabel}</span>}
      {track}
      {!stateLabel && null}
      {textLabel && labelPosition === 'right' && textLabel}
    </label>
  );
};
