'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '../lib/utils';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  debounceDelay?: number;
  icon?: React.ReactNode;
  showClear?: boolean;
}

const sizeClasses = {
  sm: 'h-8 text-xs',
  md: 'h-10 text-sm',
  lg: 'h-12 text-base',
};

export const SearchInput: React.FC<SearchInputProps> = ({
  value, onChange, onSearch, placeholder = '검색...',
  disabled = false, size = 'md', className, debounceDelay = 0, icon, showClear = true,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setLocalValue(value); }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (debounceDelay > 0) {
      debounceRef.current = setTimeout(() => { onChange(newValue); }, debounceDelay);
    } else {
      onChange(newValue);
    }
  }, [onChange, debounceDelay]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) onSearch(localValue);
  }, [onSearch, localValue]);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  return (
    <div className={cn('relative flex items-center rounded-lg border border-border bg-background transition-colors focus-within:ring-2 focus-within:ring-ring/40 focus-within:border-primary', sizeClasses[size], className)}>
      <span className="pl-3 text-muted-foreground shrink-0">
        {icon || (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 14L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </span>
      <input
        ref={inputRef} type="text" value={localValue} onChange={handleChange} onKeyDown={handleKeyDown}
        placeholder={placeholder} disabled={disabled}
        className="flex-1 bg-transparent px-2 py-0 border-0 outline-none text-foreground placeholder:text-muted-foreground disabled:opacity-50"
      />
      {showClear && localValue && (
        <button type="button" onClick={handleClear} className="pr-3 text-muted-foreground hover:text-foreground transition-colors" aria-label="검색어 지우기">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </div>
  );
};

export default SearchInput;
