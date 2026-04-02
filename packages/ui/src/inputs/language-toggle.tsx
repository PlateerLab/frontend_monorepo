'use client';

import React from 'react';
import { cn } from '../lib/utils';

export interface LanguageOption {
  value: string;
  label: string;
  ariaLabel?: string;
}

export interface LanguageToggleProps {
  options: LanguageOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function LanguageToggle({ options, value, onChange, className }: LanguageToggleProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {options.map((option) => (
        <button
          key={option.value}
          className={cn(
            'py-1.5 px-2.5 rounded-md text-xs font-semibold cursor-pointer border-none transition-all duration-200 tracking-wide',
            value === option.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
          )}
          onClick={() => onChange(option.value)}
          aria-label={option.ariaLabel}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

LanguageToggle.displayName = 'LanguageToggle';
export default LanguageToggle;
