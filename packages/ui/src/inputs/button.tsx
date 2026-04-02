'use client';

import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '../lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';
export type ButtonPadding = 'none' | 'compact' | 'default' | 'relaxed';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  padding?: ButtonPadding;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  iconOnly?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  asChild?: boolean;
  className?: string;
}

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer no-underline',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary/85 active:bg-primary/75',
        secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 active:bg-gray-300',
        outline: 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100',
        ghost: 'bg-transparent text-foreground hover:bg-accent active:bg-gray-200',
        danger: 'bg-error text-white hover:bg-error/85 active:bg-error/75',
        gradient: 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)] hover:from-blue-700 hover:to-purple-700 hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] border-none',
      },
      size: {
        sm: 'h-8 text-xs rounded-md',
        md: 'h-10 text-sm rounded-md',
        lg: 'h-12 text-base rounded-lg',
        icon: 'h-9 w-9 p-0 rounded-lg',
      },
      padding: {
        none: '',
        compact: '',
        default: '',
        relaxed: '',
      },
    },
    compoundVariants: [
      { padding: 'compact', size: 'sm', class: 'px-3' },
      { padding: 'compact', size: 'md', class: 'px-4' },
      { padding: 'compact', size: 'lg', class: 'px-5' },
      { padding: 'default', size: 'sm', class: 'px-4' },
      { padding: 'default', size: 'md', class: 'px-6' },
      { padding: 'default', size: 'lg', class: 'px-8' },
      { padding: 'relaxed', size: 'sm', class: 'px-6' },
      { padding: 'relaxed', size: 'md', class: 'px-8' },
      { padding: 'relaxed', size: 'lg', class: 'px-10' },
    ],
    defaultVariants: { variant: 'primary', size: 'md', padding: 'default' },
  }
);

export { buttonVariants };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', padding = 'default', leftIcon, rightIcon, iconOnly = false, loading = false, fullWidth = false, asChild = false, disabled, className, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    if (asChild) {
      return (
        <Comp
          ref={ref}
          className={cn(buttonVariants({ variant, size, padding }), fullWidth && 'w-full', className)}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <Comp
        ref={ref}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size, padding }), iconOnly && 'p-0 aspect-square', fullWidth && 'w-full', loading && 'cursor-wait', className)}
        {...props}
      >
        {loading && (
          <span className="animate-spin">
            <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" />
            </svg>
          </span>
        )}
        {!loading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        {!iconOnly && <span>{children}</span>}
        {iconOnly && !loading && children}
        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </Comp>
    );
  }
);

Button.displayName = 'Button';
export default Button;
