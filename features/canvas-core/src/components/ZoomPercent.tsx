'use client';

import React from 'react';
import { cn } from '@xgen/ui';

export interface ZoomPercentProps {
    /** Zoom percentage value (e.g. 100 → "100%") */
    value?: number;
    disabled?: boolean;
    className?: string;
}

const ZoomPercent: React.FC<ZoomPercentProps> = ({
    value = 100,
    disabled = false,
    className = '',
}) => {
    return (
        <div
            className={cn(
                'inline-flex h-9 py-1 px-3 items-center gap-3 rounded-lg border border-black/[0.08] bg-white/90 shadow-[0_2px_8px_0_rgba(0,0,0,0.16)] pointer-events-auto',
                disabled && 'pointer-events-none opacity-60',
                className,
            )}
            role="status"
            aria-label={`Zoom ${Math.round(value)}%`}
        >
            <span className="text-sm font-normal leading-5 text-gray-600">{Math.round(value)}%</span>
        </div>
    );
};

export default ZoomPercent;
