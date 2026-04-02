import React from 'react';
import { useTranslation } from '@xgen/i18n';
import { cn } from '@xgen/ui';
import { useBottomPanel } from '../context/BottomPanelContext';
import ChatTab from './ChatTab';
import ExecutorTab from './ExecutorTab';

const tabClass = 'flex-1 py-2 border-none bg-transparent text-xs font-medium text-gray-400 cursor-pointer relative flex items-center justify-center gap-1.5 transition-colors duration-150 hover:text-[#40444d]';
const tabActiveClass = "text-primary font-semibold after:content-[''] after:absolute after:bottom-0 after:left-4 after:right-4 after:h-0.5 after:bg-primary after:rounded-[1px]";

const ExecutionColumn: React.FC = () => {
    const { t } = useTranslation();
    const {
        activeExecutionTab,
        setActiveExecutionTab,
        executionSource,
        isExecuting,
    } = useBottomPanel();

    return (
        <div className="flex-[0_0_500px] w-[500px] min-w-[350px] max-w-[500px] flex flex-col border-r border-black/[0.08]">
            <div className="flex border-b border-black/[0.08] shrink-0 bg-[#fafbfc]">
                <button
                    type="button"
                    className={cn(tabClass, activeExecutionTab === 'chat' && tabActiveClass)}
                    onClick={() => setActiveExecutionTab('chat')}
                >
                    {t('canvas.bottomPanel.chat.title')}
                </button>
                <button
                    type="button"
                    className={cn(tabClass, activeExecutionTab === 'executor' && tabActiveClass)}
                    onClick={() => setActiveExecutionTab('executor')}
                >
                    {t('canvas.bottomPanel.executor.title')}
                    {executionSource === 'button' && isExecuting && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-[exec-pulse_1s_infinite]" />
                    )}
                </button>
            </div>

            {activeExecutionTab === 'chat' ? <ChatTab /> : <ExecutorTab />}
        </div>
    );
};

export default ExecutionColumn;
