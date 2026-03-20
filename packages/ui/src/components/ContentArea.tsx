'use client';
import React from 'react';
import type { ContentAreaProps } from '@xgen/types';

const ContentArea: React.FC<ContentAreaProps> = ({ title, description, children, headerButtons, className, showHeader = true, variant = 'card' }) => (
  <div className={`p-4 ${className ?? ''}`}>
    {showHeader && title && (
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        </div>
        {headerButtons && <div className="flex gap-2">{headerButtons}</div>}
      </div>
    )}
    {children}
  </div>
);

export default ContentArea;
