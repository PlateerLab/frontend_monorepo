import React from 'react';
import { useBottomPanel } from '../context/BottomPanelContext';
import ExecutionColumn from './ExecutionColumn';
import ExecutionOrderColumn from './ExecutionOrderColumn';
import LogColumn from './LogColumn';
import { cn } from '@xgen/ui';
import type { LogViewerProps } from '../types';

interface BottomPanelContentProps {
    LogViewerComponent?: React.ComponentType<LogViewerProps>;
}

const BottomPanelContent: React.FC<BottomPanelContentProps> = ({ LogViewerComponent }) => {
    const { panelMode } = useBottomPanel();
    const isVisible = panelMode !== 'collapsed';

    return (
        <div className={cn(
            'flex flex-1 min-h-0 bg-white border border-black/[0.08] border-t-0 overflow-hidden',
            !isVisible && 'hidden',
        )}>
            <ExecutionColumn />
            <ExecutionOrderColumn />
            <LogColumn LogViewerComponent={LogViewerComponent} />
        </div>
    );
};

export default BottomPanelContent;
