'use client';

import React from 'react';
import { cn } from '@xgen/ui';

export interface ZoomboxProps {
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    disabled?: boolean;
    /** If true, renders inline (no position: absolute) — useful for previews */
    inline?: boolean;
    className?: string;
    /** Optional zoom-in icon component */
    ZoomInIcon?: React.ComponentType<{ className?: string }>;
    /** Optional zoom-out icon component */
    ZoomOutIcon?: React.ComponentType<{ className?: string }>;
}

const Zoombox: React.FC<ZoomboxProps> = ({
    onZoomIn,
    onZoomOut,
    disabled = false,
    inline = false,
    className = '',
    ZoomInIcon,
    ZoomOutIcon,
}) => {
    return (
        <div
            className={cn(
                'inline-flex py-1 px-2 items-center gap-3 w-[84px] h-9 rounded-lg border border-black/[0.08] bg-white/90 shadow-[0_2px_8px_0_rgba(0,0,0,0.16)] pointer-events-auto',
                !inline && 'absolute right-4 bottom-4 z-[100]',
                inline && 'relative',
                disabled && 'pointer-events-none opacity-60',
                className,
            )}
            role="group"
            aria-label="Canvas zoom controls"
        >
            <button
                type="button"
                className="flex items-center justify-center w-7 h-7 p-0 border-none rounded-lg bg-transparent cursor-pointer shrink-0 transition-colors hover:enabled:bg-black/[0.06] focus-visible:outline-2 focus-visible:outline-[#305eeb] focus-visible:outline-offset-2"
                onClick={onZoomIn}
                disabled={disabled}
                aria-label="Zoom in"
                title="Zoom in"
            >
                {ZoomInIcon ? <ZoomInIcon className="block w-6 h-6" /> : <span>+</span>}
            </button>
            <button
                type="button"
                className="flex items-center justify-center w-7 h-7 p-0 border-none rounded-lg bg-transparent cursor-pointer shrink-0 transition-colors hover:enabled:bg-black/[0.06] focus-visible:outline-2 focus-visible:outline-[#305eeb] focus-visible:outline-offset-2"
                onClick={onZoomOut}
                disabled={disabled}
                aria-label="Zoom out"
                title="Zoom out"
            >
                {ZoomOutIcon ? <ZoomOutIcon className="block w-6 h-6" /> : <span>−</span>}
            </button>
        </div>
    );
};

export default Zoombox;
