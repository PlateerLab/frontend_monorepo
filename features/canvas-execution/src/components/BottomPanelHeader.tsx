import React from 'react';
import { useTranslation } from '@xgen/i18n';
import { LuTrash2, LuChevronUp, LuChevronDown } from '@xgen/icons';
import { FiMaximize2, FiMinimize2 } from '@xgen/icons';
import { Button, Separator } from '@xgen/ui';
import { useBottomPanel } from '../context/BottomPanelContext';

const BottomPanelHeader: React.FC = () => {
    const { t } = useTranslation();
    const {
        panelMode,
        togglePanel,
        setFullscreen,
        clearLogs,
        clearOutput,
    } = useBottomPanel();

    const isExpanded = panelMode !== 'collapsed';
    const isFullscreen = panelMode === 'fullscreen';

    const handleClear = () => {
        clearLogs();
        clearOutput();
    };

    const handleToggleFullscreen = () => {
        setFullscreen(!isFullscreen);
    };

    return (
        <div className="flex-[0_0_42px] h-[42px] flex items-center bg-[var(--color-bg-50)] border-t border-b border-[var(--color-line-50)]">
            {/* Left: Execution label */}
            <div className="flex-[0_0_500px] min-w-[350px] max-w-[500px] flex items-center px-4 border-r border-[var(--color-line-50)]">
                <span className="text-xs font-bold leading-4 text-[var(--color-gray-800)]">
                    {t('canvas.bottomPanel.execution')}
                </span>
            </div>

            {/* Right: Log label + actions */}
            <div className="flex-1 min-w-0 h-full flex items-center justify-between px-4">
                <span className="text-xs font-bold leading-4 text-[var(--color-gray-800)]">
                    {t('canvas.bottomPanel.log')}
                </span>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-[var(--color-gray-600)] [&_svg]:w-[18px] [&_svg]:h-[18px]"
                        onClick={handleClear}
                        title={t('canvas.bottomPanel.clear')}
                        aria-label={t('canvas.bottomPanel.clear')}
                    >
                        <LuTrash2 />
                    </Button>
                    <Separator orientation="vertical" className="h-5 bg-[var(--color-line-50)]" />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-[var(--color-gray-600)] [&_svg]:w-[18px] [&_svg]:h-[18px]"
                        onClick={handleToggleFullscreen}
                        title={
                            isFullscreen
                                ? t('canvas.bottomPanel.exitFullscreen')
                                : t('canvas.bottomPanel.fullscreen')
                        }
                        aria-label={
                            isFullscreen
                                ? t('canvas.bottomPanel.exitFullscreen')
                                : t('canvas.bottomPanel.fullscreen')
                        }
                    >
                        {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-[var(--color-gray-600)] [&_svg]:w-[18px] [&_svg]:h-[18px]"
                        onClick={togglePanel}
                        title={
                            isExpanded
                                ? t('canvas.bottomPanel.collapse')
                                : t('canvas.bottomPanel.expand')
                        }
                        aria-label={
                            isExpanded
                                ? t('canvas.bottomPanel.collapse')
                                : t('canvas.bottomPanel.expand')
                        }
                    >
                        {isExpanded ? <LuChevronDown /> : <LuChevronUp />}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default BottomPanelHeader;
