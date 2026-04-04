'use client';

import React from 'react';
import { cn } from '../lib/utils';

export type ContentAreaVariant = 'card' | 'page' | 'fullWidth' | 'toolStorage';

export interface ContentAreaProps {
  title?: string;
  description?: string;
  showHeader?: boolean;
  variant?: ContentAreaVariant;
  children: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
}

const variantClasses: Record<ContentAreaVariant, string> = {
  card: 'bg-card border-b border-border p-6',
  page: 'bg-background p-6 max-w-7xl mx-auto',
  fullWidth: 'bg-background p-6',
  toolStorage: 'bg-background p-6 max-w-7xl mx-auto',
};

export const ContentArea: React.FC<ContentAreaProps> = ({
  title, description, showHeader = true, variant = 'card',
  children, className, headerActions,
}) => {
  const shouldShowHeader = showHeader && (title || description || headerActions);

  return (
    <div className={cn(variantClasses[variant], className)}>
      {shouldShowHeader && (
        <header className="flex items-start justify-between mb-6">
          <div className="flex flex-col gap-1">
            {title && <h1 className="text-xl font-bold text-foreground">{title}</h1>}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          {headerActions && <div className="flex items-center gap-2 shrink-0">{headerActions}</div>}
        </header>
      )}
      <div>{children}</div>
    </div>
  );
};

export default ContentArea;
