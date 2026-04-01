import { useState, useCallback, useEffect } from 'react';

interface UseNodeContextMenuProps {
    nodeId: string;
    nodeName: string;
    nodeDataId?: string;
    isPreview?: boolean;
    isExpanded?: boolean;
    isBypassed?: boolean;
    isSelected?: boolean;
    onToggleExpanded?: (nodeId: string) => void;
    onToggleBypass?: (nodeId: string) => void;
    onOpenNodeModal?: (nodeId: string, paramId: string, paramName: string, currentValue: string) => void;
    handleNameDoubleClick?: (e: React.MouseEvent, nodeName: string, isPreview: boolean) => void;
    onCopyNode?: () => void;
    onDeleteNode?: () => void;
    onViewDetails?: (nodeId: string, nodeDataId: string, nodeName: string) => void;
}

interface UseNodeContextMenuReturn {
    contextMenuOpen: boolean;
    contextMenuPosition: { x: number; y: number };
    handleContextMenu: (e: React.MouseEvent) => void;
    handleContextMenuClose: () => void;
    handleContextMenuRename: () => void;
    handleContextMenuToggleExpand: () => void;
    handleContextMenuToggleBypass: () => void;
    handleContextMenuDelete: () => void;
    handleContextMenuCopy: () => void;
    handleContextMenuViewDetails: () => void;
}

interface ContextMenuState {
    isOpen: boolean;
    position: { x: number; y: number };
}

export const useNodeContextMenu = ({
    nodeId, nodeName, nodeDataId,
    isPreview = false, isExpanded = true,
    isBypassed = false, isSelected = false,
    onToggleExpanded, onToggleBypass, onOpenNodeModal,
    handleNameDoubleClick, onCopyNode, onDeleteNode, onViewDetails,
}: UseNodeContextMenuProps): UseNodeContextMenuReturn => {
    const [contextMenuState, setContextMenuState] = useState<ContextMenuState>({
        isOpen: false, position: { x: 0, y: 0 },
    });

    const handleContextMenu = useCallback((e: React.MouseEvent): void => {
        if (isPreview) return;
        e.preventDefault();
        e.stopPropagation();
        setContextMenuState({ isOpen: true, position: { x: e.clientX, y: e.clientY } });
    }, [isPreview]);

    const handleContextMenuClose = useCallback((): void => {
        setContextMenuState(prev => ({ ...prev, isOpen: false }));
    }, []);

    const handleContextMenuRename = useCallback((): void => {
        if (handleNameDoubleClick) {
            handleNameDoubleClick(
                { stopPropagation: () => {} } as React.MouseEvent,
                nodeName, isPreview
            );
        }
    }, [handleNameDoubleClick, nodeName, isPreview]);

    const handleContextMenuToggleExpand = useCallback((): void => {
        if (onToggleExpanded) onToggleExpanded(nodeId);
    }, [onToggleExpanded, nodeId]);

    const handleContextMenuToggleBypass = useCallback((): void => {
        if (onToggleBypass) onToggleBypass(nodeId);
    }, [onToggleBypass, nodeId]);

    const handleContextMenuDelete = useCallback((): void => {
        if (onDeleteNode) onDeleteNode();
    }, [onDeleteNode]);

    const handleContextMenuCopy = useCallback((): void => {
        if (onCopyNode) onCopyNode();
    }, [onCopyNode]);

    const handleContextMenuViewDetails = useCallback((): void => {
        if (onViewDetails && nodeDataId) {
            onViewDetails(nodeId, nodeDataId, nodeName);
        }
    }, [nodeId, nodeName, nodeDataId, onViewDetails]);

    useEffect(() => {
        if (contextMenuState.isOpen || !isSelected || isPreview) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;
            if (e.key === 'F2') {
                e.preventDefault();
                e.stopPropagation();
                handleContextMenuRename();
                return;
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [contextMenuState.isOpen, isSelected, isPreview, handleContextMenuRename]);

    return {
        contextMenuOpen: contextMenuState.isOpen,
        contextMenuPosition: contextMenuState.position,
        handleContextMenu, handleContextMenuClose,
        handleContextMenuRename, handleContextMenuToggleExpand,
        handleContextMenuToggleBypass, handleContextMenuDelete,
        handleContextMenuCopy, handleContextMenuViewDetails,
    };
};
