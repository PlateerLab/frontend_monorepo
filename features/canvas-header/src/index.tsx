import './locales';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { LuCheck, LuX, LuPencil, LuUsers, LuChevronDown, LuCirclePlus, LuSparkles } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { Button, DropdownMenu } from '@xgen/ui';
import type { DropdownMenuItem } from '@xgen/ui';
import type { CanvasPagePlugin, CanvasHeaderProps } from '@xgen/types';

export type CanvasMode = 'edit' | 'run';

const CanvasHeader: React.FC<CanvasHeaderProps> = ({
    workflowName: externalWorkflowName,
    workflowId,
    onSave,
    onNewWorkflow,
    onDeploy,
    onAddNodeClick,
    onAutoWorkflowClick,
    onTemplateStart,
    onImportWorkflow,
    onWorkflowNameChange,
    onDuplicate,
    isOwner = true,
    sidebarLayout,
    renameWorkflow,
    checkWorkflowExistence,
    listWorkflows,
}) => {
    const [workflowName, setWorkflowName] = useState<string>('Workflow');
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editValue, setEditValue] = useState<string>('');
    const [oldWorkflowName, setOldWorkflowName] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null);
    const { t } = useTranslation();

    useEffect(() => {
        if (externalWorkflowName) {
            setWorkflowName(externalWorkflowName);
        }
    }, [externalWorkflowName]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleEditClick = useCallback((): void => {
        setOldWorkflowName(workflowName);
        setEditValue(workflowName);
        setIsEditing(true);
    }, [workflowName]);

    const handleSaveClick = useCallback(async (): Promise<void> => {
        const trimmedValue = editValue.trim();
        const finalValue = trimmedValue || 'Workflow';

        if (finalValue === oldWorkflowName) {
            setIsEditing(false);
            return;
        }

        try {
            if (renameWorkflow && checkWorkflowExistence && workflowId) {
                const checkResult = await checkWorkflowExistence(oldWorkflowName);
                if (checkResult.exists) {
                    await renameWorkflow(oldWorkflowName, finalValue, workflowId);
                } else if (listWorkflows) {
                    const existingWorkflows = await listWorkflows();
                    const workflowNames = new Set(
                        existingWorkflows.map((item: any) => {
                            const name = typeof item === 'string' ? item :
                                (item?.workflow_name || item?.name || '');
                            return name.replace(/\.json$/i, '').trim();
                        })
                    );
                    if (workflowNames.has(finalValue)) {
                        setEditValue(oldWorkflowName);
                        return;
                    }
                }
            }

            setWorkflowName(finalValue);
            onWorkflowNameChange?.(finalValue);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to rename workflow:', error);
            setEditValue(oldWorkflowName);
        }
    }, [editValue, oldWorkflowName, workflowId, renameWorkflow, checkWorkflowExistence, listWorkflows, onWorkflowNameChange]);

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
            { key: 'empty', label: t('canvas.header.emptyWorkflow', 'Empty Workflow') },
        ];
        if (onTemplateStart) {
            items.push({ key: 'template', label: t('canvas.header.startFromTemplate', 'Start from Template') });
        }
        if (onImportWorkflow) {
            items.push({ key: 'import', label: t('canvas.header.importWorkflow', 'Import Workflow') });
        }
        return items;
    }, [t, onTemplateStart, onImportWorkflow]);

    const handleDropdownSelect = useCallback((key: string) => {
        switch (key) {
            case 'empty': onNewWorkflow(); break;
            case 'template': onTemplateStart?.(); break;
            case 'import': onImportWorkflow?.(); break;
        }
    }, [onNewWorkflow, onTemplateStart, onImportWorkflow]);

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
            {/* Left — Workflow name */}
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
                                placeholder={t('canvas.header.workflowNamePlaceholder', 'Workflow name')}
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
                                    title={t('canvas.header.sharedWorkflowTooltip', 'Shared')}
                                >
                                    <LuUsers />
                                </span>
                            )}
                            {isOwner && (
                                <button
                                    onClick={handleEditClick}
                                    className="inline-flex items-center justify-center w-6 h-6 min-w-6 min-h-6 shrink-0 text-base rounded cursor-pointer bg-transparent border-none p-0 text-[var(--color-gray-500)] transition-colors hover:bg-black/[0.06]"
                                    title={t('canvas.header.editWorkflowName', 'Edit name')}
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
                            {t('canvas.header.newWorkflow', 'New Workflow')}
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
                    title={t('canvas.header.saveWorkflow', 'Save')}
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
                        title={t('canvas.header.copyWorkflow', 'Copy')}
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
                {onAutoWorkflowClick && (
                    <button
                        type="button"
                        className="flex items-center justify-center w-7 h-7 min-w-7 min-h-7 p-0 bg-transparent border-none text-[var(--color-gray-600)] cursor-pointer rounded-lg select-none transition-colors hover:bg-black/[0.04]"
                        onClick={onAutoWorkflowClick}
                        title={t('canvas.header.autoWorkflow', 'Auto Workflow')}
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
