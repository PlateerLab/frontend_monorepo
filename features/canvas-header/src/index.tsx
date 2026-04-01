import './locales';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LuCheck, LuX, LuPencil, LuUsers, LuChevronDown } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import styles from './styles/header.module.scss';
import type { CanvasPagePlugin, CanvasPluginContext } from '@xgen/types';

export type CanvasMode = 'edit' | 'run';

export interface CanvasHeaderProps extends CanvasPluginContext {
    onSave: () => void;
    onNewWorkflow: () => void;
    onDeploy: () => void;
    onAddNodeClick?: () => void;
    onAutoWorkflowClick?: () => void;
    onTemplateStart?: () => void;
    onImportWorkflow?: () => void;
    onWorkflowNameChange?: (name: string) => void;
    onDuplicate?: () => void;
    isOwner?: boolean;
    sidebarLayout?: { isOpen: boolean };
    /** External workflow name rename handler */
    renameWorkflow?: (oldName: string, newName: string, workflowId: string) => Promise<void>;
    /** Check if workflow exists */
    checkWorkflowExistence?: (name: string) => Promise<{ exists: boolean }>;
    /** List all workflows for duplicate name check */
    listWorkflows?: () => Promise<any[]>;
}

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
    const [newWorkflowDropdownOpen, setNewWorkflowDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const { t } = useTranslation();

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setNewWorkflowDropdownOpen(false);
            }
        };
        if (newWorkflowDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [newWorkflowDropdownOpen]);

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

    return (
        <header
            className={styles.header}
            style={
                sidebarLayout !== undefined
                    ? {
                        left: sidebarLayout.isOpen ? 250 : 72,
                        width: sidebarLayout.isOpen ? 'calc(100% - 250px)' : 'calc(100% - 72px)',
                    }
                    : undefined
            }
        >
            <div className={styles.leftSection}>
                <div className={styles.workflowNameSection}>
                    {isEditing ? (
                        <div className={styles.editMode}>
                            <input
                                ref={inputRef}
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className={styles.workflowInput}
                                placeholder={t('canvas.header.workflowNamePlaceholder', 'Workflow name')}
                            />
                            <button
                                onClick={handleSaveClick}
                                className={`${styles.editButton} ${styles.saveButton}`}
                                title={t('canvas.header.saveName', 'Save')}
                                type="button"
                            >
                                <LuCheck />
                            </button>
                            <button
                                onClick={handleCancelClick}
                                className={`${styles.editButton} ${styles.cancelButton}`}
                                title={t('canvas.header.cancel', 'Cancel')}
                                type="button"
                            >
                                <LuX />
                            </button>
                        </div>
                    ) : (
                        <div className={styles.displayMode}>
                            <span className={styles.workflowName}>{workflowName}</span>
                            {!isOwner && (
                                <span className={styles.sharedIndicator} title={t('canvas.header.sharedWorkflowTooltip', 'Shared')}>
                                    <LuUsers />
                                </span>
                            )}
                            {isOwner && (
                                <button
                                    onClick={handleEditClick}
                                    className={`${styles.editButton} ${styles.editButtonPencil}`}
                                    title={t('canvas.header.editWorkflowName', 'Edit name')}
                                    type="button"
                                >
                                    <LuPencil />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.rightSection}>
                <div className={styles.dropdownWrap} ref={dropdownRef}>
                    <button
                        type="button"
                        className={styles.newWorkflowDropdownTrigger}
                        onClick={() => setNewWorkflowDropdownOpen((v) => !v)}
                        aria-expanded={newWorkflowDropdownOpen}
                    >
                        {t('canvas.header.newWorkflow', 'New Workflow')}
                        <LuChevronDown className={styles.chevron} />
                    </button>
                    {newWorkflowDropdownOpen && (
                        <div className={styles.newWorkflowDropdown}>
                            <button type="button" onClick={() => { onNewWorkflow(); setNewWorkflowDropdownOpen(false); }}>
                                {t('canvas.header.emptyWorkflow', 'Empty Workflow')}
                            </button>
                            {onTemplateStart && (
                                <button type="button" onClick={() => { onTemplateStart(); setNewWorkflowDropdownOpen(false); }}>
                                    {t('canvas.header.startFromTemplate', 'Start from Template')}
                                </button>
                            )}
                            {onImportWorkflow && (
                                <button type="button" onClick={() => { onImportWorkflow(); setNewWorkflowDropdownOpen(false); }}>
                                    {t('canvas.header.importWorkflow', 'Import Workflow')}
                                </button>
                            )}
                        </div>
                    )}
                </div>
                <button onClick={onSave} className={styles.textButton} title={t('canvas.header.saveWorkflow', 'Save')} type="button">
                    {t('canvas.header.save', 'Save')}
                </button>
                {onDuplicate && (
                    <button onClick={onDuplicate} className={styles.textButton} title={t('canvas.header.copyWorkflow', 'Copy')} type="button">
                        {t('canvas.header.copy', 'Copy')}
                    </button>
                )}
                <button
                    type="button"
                    className={styles.deploySettingsButton}
                    onClick={onDeploy}
                    title={t('canvas.header.deploy', 'Deploy')}
                >
                    {t('canvas.header.deploy', 'Deploy')}
                </button>
                {onAddNodeClick && (
                    <button type="button" className={styles.menuButton} onClick={onAddNodeClick} title={t('canvas.header.addNode', 'Add Node')}>
                        +
                    </button>
                )}
                {onAutoWorkflowClick && (
                    <button
                        onClick={onAutoWorkflowClick}
                        className={styles.menuButton}
                        title={t('canvas.header.autoWorkflow', 'Auto Workflow')}
                        type="button"
                    >
                        ✦
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
    headerComponent: CanvasHeader as any,
};

export { CanvasHeader };
export default CanvasHeader;
