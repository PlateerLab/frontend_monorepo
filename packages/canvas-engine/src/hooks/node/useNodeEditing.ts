import { useState, useEffect } from 'react';
import type { UseNodeEditingReturn } from '../../components/Node/types';

export const useNodeEditing = (initialNodeName: string): UseNodeEditingReturn => {
    const [isEditingName, setIsEditingName] = useState<boolean>(false);
    const [editingName, setEditingName] = useState<string>(initialNodeName);

    useEffect(() => {
        setEditingName(initialNodeName);
    }, [initialNodeName]);

    const handleNameDoubleClick = (
        e: React.MouseEvent,
        nodeName: string,
        isPreview?: boolean
    ): void => {
        if (isPreview) return;
        e.stopPropagation();
        setIsEditingName(true);
        setEditingName(nodeName);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setEditingName(e.target.value);
    };

    const handleNameKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>,
        nodeId: string,
        nodeName: string,
        onNodeNameChange?: (nodeId: string, newName: string) => void
    ): void => {
        e.stopPropagation();
        if (e.key === 'Enter') {
            e.preventDefault();
            handleNameSubmit(nodeId, nodeName, onNodeNameChange);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleNameCancel(nodeName);
        }
    };

    const handleNameSubmit = (
        nodeId: string,
        nodeName: string,
        onNodeNameChange?: (nodeId: string, newName: string) => void
    ): void => {
        const trimmedName = editingName.trim();
        if (trimmedName && trimmedName !== nodeName && onNodeNameChange) {
            onNodeNameChange(nodeId, trimmedName);
        } else {
            setEditingName(nodeName);
        }
        setIsEditingName(false);
    };

    const handleNameCancel = (nodeName: string): void => {
        setEditingName(nodeName);
        setIsEditingName(false);
    };

    const handleNameBlur = (
        nodeId: string,
        nodeName: string,
        onNodeNameChange?: (nodeId: string, newName: string) => void
    ): void => {
        handleNameSubmit(nodeId, nodeName, onNodeNameChange);
    };

    return {
        isEditingName,
        editingName,
        handleNameDoubleClick,
        handleNameChange,
        handleNameKeyDown,
        handleNameSubmit,
        handleNameCancel,
        handleNameBlur
    };
};
