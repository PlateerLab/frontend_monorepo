import React from 'react';
import { useTranslation } from '@xgen/i18n';
import { useBottomPanel } from '../context/BottomPanelContext';

const ExecutorTab: React.FC = () => {
    const { t } = useTranslation();
    const { buttonResultText, isExecuting, executionSource } = useBottomPanel();

    const showLoading = executionSource === 'button' && isExecuting && !buttonResultText;
    const showPlaceholder = !buttonResultText && !showLoading;

    return (
        <div className="flex-1 overflow-y-auto py-3 px-4 text-xs font-normal leading-4 text-[#40444d]">
            {showPlaceholder ? (
                <span className="text-[#7a7f89]">
                    {t('canvas.bottomPanel.executor.placeholder')}
                </span>
            ) : (
                <>
                    {showLoading && (
                        <div className="flex gap-1 py-2 [&_span]:w-1.5 [&_span]:h-1.5 [&_span]:rounded-full [&_span]:bg-gray-400 [&_span]:animate-[bouncing-dots_1.2s_infinite] [&_span:nth-child(2)]:delay-200 [&_span:nth-child(3)]:delay-[400ms]">
                            <span /><span /><span />
                        </div>
                    )}
                    <pre className="m-0 whitespace-pre-wrap break-words">{buttonResultText}</pre>
                </>
            )}
        </div>
    );
};

export default ExecutorTab;
