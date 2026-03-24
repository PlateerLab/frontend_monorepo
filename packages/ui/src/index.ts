'use client';

import React from 'react';

// ContentArea Component
interface ContentAreaProps {
  children: React.ReactNode;
  className?: string;
}

export const ContentArea: React.FC<ContentAreaProps> = ({ children, className = '' }) => {
  return (
    <div className={`content-area ${className}`}>
      {children}
    </div>
  );
};

// Re-export common UI types
export type { ContentAreaProps };
