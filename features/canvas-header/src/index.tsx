import './locales';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { LuCheck, LuX, LuPencil, LuUsers, LuChevronDown, LuCirclePlus, LuSparkles, LuHistory } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { Button, DropdownMenu } from '@xgen/ui';
import type { DropdownMenuItem } from '@xgen/ui';
import type { CanvasPagePlugin, CanvasHeaderProps } from '@xgen/types';

export type CanvasMode = 'edit' | 'run';

const CanvasHeader: React.FC<CanvasHeaderProps> = ({
    workflowName: externalAgentflowName,
    workflowId,
    onSave,
    onNewAgentflow,
    onDeploy,
    onAddNodeClick,
    onAutoAgentflowClick,
    onHistoryClick,
    onTemplateStart,
    onImportAgentflow,
    onAgentflowNameChange,
    onDuplicate,
    isOwner = true,
    sidebarLayout,
    renameAgentflow,
    checkAgentflowExistence,
    listAgentflows,
}) => {
    const [workflowName, setAgentflowName] = useState<string>('Agentflow');
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editValue, setEditValue] = useState<string>('');
    const [oldAgentflowName, setOldAgentflowName] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null);
    const { t } = useTranslation();

    useEffect(() => {
        if (externalAgentflowName) {
            setAgentflowName(externalAgentflowName);
        }
    }, [externalAgentflowName]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleEditClick = useCallback((): void => {
        setOldAgentflowName(workflowName);
        setEditValue(workflowName);
        setIsEditing(true);
    }, [workflowName]);

    const handleSaveClick = useCallback(async (): Promise<void> => {
        const trimmedValue = editValue.trim();
        const finalValue = trimmedValue || 'Agentflow';

        if (finalValue === oldAgentflowName) {
            setIsEditing(false);
            return;
        }

        try {
            if (renameAgentflow && checkAgentflowExistence && workflowId) {
                const checkResult = await checkAgentflowExistence(oldAgentflowName);
                if (checkResult.exists) {
                    await renameAgentflow(oldAgentflowName, finalValue, workflowId);
                } else if (listAgentflows) {
                    const existingAgentflows = await listAgentflows();
                    const workflowNames = new Set(
                        existingAgentflows.map((item: any) => {
                            const name = typeof item === 'string' ? item :
                                (item?.workflow_name || item?.name || '');
                            return name.replace(/\.json$/i, '').trim();
                        })
                    );
                    if (workflowNames.has(finalValue)) {
                        setEditValue(oldAgentflowName);
                        return;
                    }
                }
            }

            setAgentflowName(finalValue);
            onAgentflowNameChange?.(finalValue);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to rename workflow:', error);
            setEditValue(oldAgentflowName);
        }
    }, [editValue, oldAgentflowName, workflowId, renameAgentflow, checkAgentflowExistence, listAgentflows, onAgentflowNameChange]);

    const handleCancelClick = useCallback((): void => {
        setEditValue(workflowName);
        setIsEditing(false);
    }, [workflowName]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter') {
            void handleSaveClick();
        } else if (e.key === 'Escape') {
            handleCancelClick();
        }
    }, [handleSaveClick, handleCancelClick]);

    const dropdownItems = useMemo<DropdownMenuItem[]>(() => {
        const items: DropdownMenuItem[] = [
            { key: 'empty', label: t('canvas.header.emptyAgentflow', 'Empty Agentflow') },
        ];
        if (onTemplateStart) {
            items.push({ key: 'template', label: t('canvas.header.startFromTemplate', 'Start from Template') });
        }
        if (onImportAgentflow) {
            items.push({ key: 'import', label: t('canvas.header.importAgentflow', 'Import Agentflow') });
        }
        return items;
    }, [t, onTemplateStart, onImportAgentflow]);

    const handleDropdownSelect = useCallback((key: string) => {
        switch (key) {
            case 'empty': onNewAgentflow(); break;
            case 'template': onTemplateStart?.(); break;
            case 'import': onImportAgentflow?.(); break;
        }
    }, [onNewAgentflow, onTemplateStart, onImportAgentflow]);

    return (
        <header
            className="flex justify-between items-center h-14 px-[22px] min-h-14 max-h-14 bg-[var(--color-bg-50)] border-b border-[var(--color-line-50)] shrink-0 z-[1000] fixed top-0 left-0 w-full transition-[left,width] duration-[250ms] ease-out select-none"
            style={
                sidebarLayout !== undefined
                    ? {
                        left: sidebarLayout.isOpen ? 250 : 72,
                        width: sidebarLayout.isOpen ? 'calc(100% - 250px)' : 'calc(100% - 72px)',
                    }
                    : undefined
            }
        >
            {/* Left — Agentflow name */}
            <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="min-w-[120px] max-w-[360px]">
                    {isEditing ? (
                        <div className="flex items-center gap-1 h-7">
                            <input
                                ref={inputRef}
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="h-7 text-sm font-bold text-[var(--color-gray-800)] border border-[var(--color-secondary-200)] rounded-md px-2 bg-white outline-none min-w-[120px] shadow-[0_0_0_2px_rgba(48,94,235,0.1)] focus:border-[var(--color-secondary-200)]"
                                placeholder={t('canvas.header.agentflowNamePlaceholder', 'Agentflow name')}
                            />
                            <button
                                onClick={handleSaveClick}
                                className="inline-flex items-center justify-center w-7 h-7 min-w-7 min-h-7 shrink-0 text-xl rounded cursor-pointer bg-transparent border-none p-0 text-green-600 transition-colors hover:bg-green-100"
                                title={t('canvas.header.saveName', 'Save')}
                                type="button"
                            >
                                <LuCheck className="w-[1em] h-[1em] shrink-0" />
                            </button>
                            <button
                                onClick={handleCancelClick}
                                className="inline-flex items-center justify-center w-7 h-7 min-w-7 min-h-7 shrink-0 text-xl rounded cursor-pointer bg-transparent border-none p-0 text-red-500 transition-colors hover:bg-red-100"
                                title={t('canvas.header.cancel', 'Cancel')}
                                type="button"
                            >
                                <LuX className="w-[1em] h-[1em] shrink-0" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between gap-2 h-7 px-2 rounded-md transition-colors min-w-[120px] hover:bg-black/[0.04]">
                            <span className="text-sm font-bold leading-tight text-[var(--color-gray-800)] cursor-pointer flex-grow text-left min-w-0">
                                {workflowName}
                            </span>
                            {!isOwner && (
                                <span
                                    className="flex items-center justify-center text-[0.9rem] text-[var(--color-gray-500)] p-1 rounded min-w-6 min-h-6 shrink-0 cursor-help transition-all hover:bg-black/[0.06] hover:text-[var(--color-gray-600)] hover:scale-110"
                                    title={t('canvas.header.sharedAgentflowTooltip', 'Shared')}
                                >
                                    <LuUsers />
                                </span>
                            )}
                            {isOwner && (
                                <button
                                    onClick={handleEditClick}
                                    className="inline-flex items-center justify-center w-6 h-6 min-w-6 min-h-6 shrink-0 text-base rounded cursor-pointer bg-transparent border-none p-0 text-[var(--color-gray-500)] transition-colors hover:bg-black/[0.06]"
                                    title={t('canvas.header.editAgentflowName', 'Edit name')}
                                    type="button"
                                >
                                    <LuPencil className="w-[1em] h-[1em] shrink-0" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Right — Actions */}
            <div className="flex items-center gap-2 shrink-0">
                <DropdownMenu
                    trigger={
                        <Button
                            variant="primary"
                            size="sm"
                            padding="compact"
                            className="h-7 rounded-lg text-sm font-medium"
                            rightIcon={<LuChevronDown className="w-4 h-4 shrink-0 opacity-90" />}
                        >
                            {t('canvas.header.newAgentflow', 'New Agentflow')}
                        </Button>
                    }
                    items={dropdownItems}
                    onSelect={handleDropdownSelect}
                    placement="bottom-start"
                    width={180}
                />
                <Button
                    variant="outline"
                    size="sm"
                    padding="compact"
                    className="h-7 rounded-lg text-sm font-medium text-[var(--color-gray-800)] border-[var(--color-line-50)]"
                    onClick={onSave}
                    title={t('canvas.header.saveAgentflow', 'Save')}
                >
                    {t('canvas.header.save', 'Save')}
                </Button>
                {onDuplicate && (
                    <Button
                        variant="outline"
                        size="sm"
                        padding="compact"
                        className="h-7 rounded-lg text-sm font-medium text-[var(--color-gray-800)] border-[var(--color-line-50)]"
                        onClick={onDuplicate}
                        title={t('canvas.header.copyAgentflow', 'Copy')}
                    >
                        {t('canvas.header.copy', 'Copy')}
                    </Button>
                )}
                <Button
                    variant="outline"
                    size="sm"
                    padding="compact"
                    className="h-7 rounded-lg text-sm font-medium text-[var(--color-secondary-200)] border-[var(--color-secondary-200)] hover:bg-[var(--color-secondary-200)]/5"
                    onClick={onDeploy}
                    title={t('canvas.header.deploy', 'Deploy')}
                >
                    {t('canvas.header.deploy', 'Deploy')}
                </Button>
                {onAddNodeClick && (
                    <button
                        type="button"
                        className="flex items-center justify-center w-7 h-7 min-w-7 min-h-7 p-0 bg-transparent border-none text-[var(--color-gray-600)] cursor-pointer rounded-lg select-none transition-colors hover:bg-black/[0.04]"
                        onClick={onAddNodeClick}
                        title={t('canvas.header.addNode', 'Add Node')}
                    >
                        <LuCirclePlus />
                    </button>
                )}
                {onHistoryClick && (
                    <button
                        type="button"
                        className="flex items-center justify-center w-7 h-7 min-w-7 min-h-7 p-0 bg-transparent border-none text-[var(--color-gray-600)] cursor-pointer rounded-lg select-none transition-colors hover:bg-black/[0.04]"
                        onClick={onHistoryClick}
                        title={t('canvas.header.history', 'History')}
                    >
                        <LuHistory />
                    </button>
                )}
                {onAutoAgentflowClick && (
                    <button
                        type="button"
                        className="flex items-center justify-center w-7 h-7 min-w-7 min-h-7 p-0 bg-transparent border-none text-[var(--color-gray-600)] cursor-pointer rounded-lg select-none transition-colors hover:bg-black/[0.04]"
                        onClick={onAutoAgentflowClick}
                        title={t('canvas.header.autoAgentflow', 'Auto Agentflow')}
                    >
                        <LuSparkles />
                    </button>
                )}
            </div>
        </header>
    );
};

// Plugin registration
export const canvasHeaderPlugin: CanvasPagePlugin = {
    id: 'canvas-header',
    name: 'Canvas Header',
    headerComponent: CanvasHeader,
};

export { CanvasHeader };
export default CanvasHeader;
