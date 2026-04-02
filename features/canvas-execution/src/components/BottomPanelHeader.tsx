import React from 'react';
import { useTranslation } from '@xgen/i18n';
import { LuTrash2, LuChevronUp, LuChevronDown } from '@xgen/icons';
import { FiMaximize2, FiMinimize2 } from '@xgen/icons';
import { useBottomPanel } from '../context/BottomPanelContext';

const iconBtnClass = 'w-7 h-7 rounded-lg border-none p-0 flex items-center justify-center bg-transparent cursor-pointer text-[#40444d] transition-[background] duration-150 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-default [&_svg]:w-[18px] [&_svg]:h-[18px]';

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
        <div className="flex-[0_0_42px] h-[42px] flex items-center bg-white border-t border-b border-black/[0.08]">
            {/* Left: Execution label */}
            <div className="flex-[0_0_500px] min-w-[350px] max-w-[500px] flex items-center px-4">
                <span className="text-xs font-bold leading-4 text-[#1d1f23]">
                    {t('canvas.bottomPanel.execution')}
                </span>
            </div>

            {/* Right: Log label + actions */}
            <div className="flex-1 min-w-0 h-full flex items-center justify-between px-4 border-l border-black/[0.08]">
                <span className="text-xs font-bold leading-4 text-[#1d1f23]">
                    {t('canvas.bottomPanel.log')}
                </span>
                <div className="flex items-center gap-2">
                    <button
                        className={iconBtnClass}
                        onClick={handleClear}
                        title={t('canvas.bottomPanel.clear')}
                        aria-label={t('canvas.bottomPanel.clear')}
                    >
                        <LuTrash2 />
                    </button>
                    <span className="block w-px h-7 bg-black/[0.08] shrink-0" />
                    <button
                        className={iconBtnClass}
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
                    </button>
                    <button
                        className={iconBtnClass}
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
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BottomPanelHeader;
