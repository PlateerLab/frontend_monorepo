'use client';

import React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from '../lib/utils';

export interface DropdownMenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
  onSelect: (key: string) => void;
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
  className?: string;
  width?: number | 'auto';
}

const sideMap: Record<string, 'bottom' | 'top'> = {
  'bottom-start': 'bottom',
  'bottom-end': 'bottom',
  'top-start': 'top',
  'top-end': 'top',
};

const alignMap: Record<string, 'start' | 'end'> = {
  'bottom-start': 'start',
  'bottom-end': 'end',
  'top-start': 'start',
  'top-end': 'end',
};

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  items,
  onSelect,
  placement = 'bottom-end',
  className,
  width = 'auto',
}) => {
  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        <div className="inline-flex cursor-pointer">{trigger}</div>
      </DropdownMenuPrimitive.Trigger>

      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          side={sideMap[placement]}
          align={alignMap[placement]}
          sideOffset={4}
          className={cn(
            'z-50 rounded-md border border-border bg-white py-1 shadow-lg',
            'animate-in fade-in-0 zoom-in-95',
            className,
          )}
          style={{
            width: width === 'auto' ? 'auto' : `${width}px`,
            minWidth: width === 'auto' ? '160px' : undefined,
          }}
        >
          {items.map((item) => (
            <React.Fragment key={item.key}>
              {item.divider && <DropdownMenuPrimitive.Separator className="h-px bg-border my-1" />}
              <DropdownMenuPrimitive.Item
                disabled={item.disabled}
                onSelect={() => onSelect(item.key)}
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
  );
};

export default DropdownMenu;
