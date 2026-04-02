'use client';

import React from 'react';
import { useTranslation } from '@xgen/i18n';
import { cn } from '@xgen/ui';

export type CanvasMode = 'edit' | 'run';

export interface EditRunFloatingProps {
    mode: CanvasMode;
    onModeChange: (mode: CanvasMode) => void;
    /** True while workflow is executing — disables both buttons */
    disabled?: boolean;
    /** Optional play icon component to render in the run button */
    PlayIcon?: React.ComponentType<{ className?: string }>;
}

const EditRunFloating: React.FC<EditRunFloatingProps> = ({ mode, onModeChange, disabled, PlayIcon }) => {
    const { t } = useTranslation();

    return (
        <div
            className={cn(
                'absolute top-[78px] left-1/2 -translate-x-1/2 z-[1100] pointer-events-auto isolate',
                disabled && 'pointer-events-none opacity-60',
            )}
            role="group"
            aria-label={`${t('canvas.header.edit', 'Edit')} / ${t('canvas.header.run', 'Run')}`}
            aria-disabled={disabled}
        >
            <div className="flex items-center gap-2 p-1 min-h-9 min-w-[144px] rounded-lg bg-white/90 border border-black/[0.08] shadow-[0_2px_8px_0_rgba(0,0,0,0.16)]">
                <button
                    type="button"
                    className="flex-[0_0_64px] w-16 inline-flex items-center justify-center min-h-7 text-xs font-normal leading-4 border-none cursor-pointer bg-transparent text-gray-600 p-0"
                    onClick={() => !disabled && onModeChange('edit')}
                    aria-pressed={mode === 'edit'}
                    disabled={disabled}
                >
                    <span className={cn(
                        'inline-flex items-center justify-center gap-1 w-16 min-h-7 py-1.5 px-1 rounded-lg transition-colors duration-200',
                        mode === 'edit' ? 'bg-[#305eeb] text-white pl-3 pr-2' : 'hover:bg-black/[0.06] text-gray-600',
                    )}>
                        {t('canvas.header.edit', 'Edit')}
                    </span>
                </button>
                <button
                    type="button"
                    className="flex-[0_0_64px] w-16 inline-flex items-center justify-center min-h-7 text-xs font-normal leading-4 border-none cursor-pointer bg-transparent text-gray-600 p-0"
                    onClick={() => !disabled && onModeChange('run')}
                    aria-pressed={mode === 'run'}
                    disabled={disabled}
                >
                    <span className={cn(
                        'inline-flex items-center justify-center gap-1 w-16 min-h-7 py-1.5 px-1 rounded-lg transition-colors duration-200',
                        mode === 'run' ? 'bg-[#305eeb] text-white pl-3 pr-2' : 'hover:bg-black/[0.06] text-gray-600',
                    )}>
                        {t('canvas.header.run', 'Run')}
                        {PlayIcon && <PlayIcon className="inline-flex items-center justify-center w-[18px] h-[18px] shrink-0" />}
                    </span>
                </button>
            </div>
        </div>
    );
};

export default EditRunFloating;
