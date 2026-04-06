import React from 'react';
import { useTranslation } from '@xgen/i18n';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@xgen/ui';
import { useBottomPanel } from '../context/BottomPanelContext';
import ChatTab from './ChatTab';
import ExecutorTab from './ExecutorTab';

const ExecutionColumn: React.FC = () => {
    const { t } = useTranslation();
    const {
        activeExecutionTab,
        setActiveExecutionTab,
        executionSource,
        isExecuting,
    } = useBottomPanel();

    return (
        <div className="flex-[0_0_500px] w-[500px] min-w-[350px] max-w-[500px] flex flex-col border-r border-[var(--color-line-50)]">
            <Tabs value={activeExecutionTab} onValueChange={setActiveExecutionTab} className="flex flex-col flex-1 min-h-0">
                <TabsList className="h-[41px] rounded-none border-b border-[var(--color-line-50)] bg-[var(--color-bg-50)] p-0 w-full shrink-0">
                    <TabsTrigger
                        value="chat"
                        className="flex-1 h-full rounded-none border-b-2 border-transparent text-xs font-medium text-[var(--color-gray-500)] shadow-none data-[state=active]:border-b-primary data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-none data-[state=active]:bg-transparent"
                    >
                        {t('canvas.bottomPanel.chat.title')}
                    </TabsTrigger>
                    <TabsTrigger
                        value="executor"
                        className="flex-1 h-full rounded-none border-b-2 border-transparent text-xs font-medium text-[var(--color-gray-500)] shadow-none data-[state=active]:border-b-primary data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-none data-[state=active]:bg-transparent"
                    >
                        <span className="inline-flex items-center gap-1.5">
                            {t('canvas.bottomPanel.executor.title')}
                            {executionSource === 'button' && isExecuting && (
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-[exec-pulse_1s_infinite]" />
                            )}
                        </span>
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="chat" className="flex-1 flex flex-col min-h-0 mt-0">
                    <ChatTab />
                </TabsContent>
                <TabsContent value="executor" className="flex-1 flex flex-col min-h-0 mt-0">
                    <ExecutorTab />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ExecutionColumn;
