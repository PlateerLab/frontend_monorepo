import React, { useMemo, useState, useCallback } from 'react';
import { LuPlus, LuRefreshCw, LuCopy, LuTrash2, FiInfo } from '@xgen/icons';
import { ToggleSwitch } from '@xgen/ui';
import styles from '../../../styles/Node.module.scss';
import { separateParameters, detectParameterType, createCustomParameter, duplicateParameter, getLocalizedDescription } from '../utils/parameterUtils';
import { useApiParameters } from '../../../hooks/node/useApiParameters';
import { useTranslation } from '@xgen/i18n';
import { useParameterEditing } from '../../../hooks/node/useParameterEditing';
import type { NodeParametersProps } from '../types';
import type { Parameter } from '@xgen/canvas-types';

export const NodeParameters: React.FC<NodeParametersProps & {
    fetchParameterOptions?: (nodeDataId: string, apiName: string) => Promise<any[]>;
}> = ({
    nodeId,
    nodeDataId,
    parameters,
    isPreview = false,
    onParameterChange,
    onParameterNameChange,
    onParameterAdd,
    onParameterDelete,
    onClearSelection,
    onOpenNodeModal,
    showAdvanced,
    onToggleAdvanced,
    fetchParameterOptions
}) => {
    const [toolNameError, setToolNameError] = useState('');
    const [hoveredParam, setHoveredParam] = useState<string | null>(null);
    const { locale } = useTranslation();

    const { basicParameters, advancedParameters, hasAdvancedParams } = separateParameters(parameters);

    const apiParamsHook = useApiParameters(nodeDataId, nodeId, parameters, onParameterChange, fetchParameterOptions);
    const paramEditingHook = useParameterEditing();

    const getParamDescription = useCallback((param: Parameter): string => {
        return getLocalizedDescription(param, locale);
    }, [locale]);

    const parameterValueMap = useMemo(() => {
        const valueMap: Record<string, Parameter['value'] | undefined> = {};
        (parameters ?? []).forEach((param) => {
            valueMap[param.id] = param.value;
        });
        return valueMap;
    }, [parameters]);

    const normalizeBoolean = (value: Parameter['value'] | undefined): boolean | undefined => {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
            const normalized = value.trim().toLowerCase();
            if (normalized === 'true') return true;
            if (normalized === 'false') return false;
        }
        return undefined;
    };

    const isDependencySatisfied = (param: Parameter, visited?: Set<string>): boolean => {
        if (!param.dependency) return true;

        const seen = visited ?? new Set<string>();
        if (seen.has(param.id)) return true;
        seen.add(param.id);

        const parentParam = (parameters ?? []).find((p) => p.id === param.dependency);
        if (parentParam && !isDependencySatisfied(parentParam, seen)) {
            return false;
        }

        const dependencyValue = parameterValueMap[param.dependency];
        const expectedValue = param.dependencyValue ?? true;

        if (Array.isArray(expectedValue)) {
            return expectedValue.some((ev: any) => {
                if (typeof ev === 'boolean') {
                    const normalized = normalizeBoolean(dependencyValue);
                    return normalized !== undefined ? normalized === ev : dependencyValue === ev;
                }
                if (typeof ev === 'string' && typeof dependencyValue === 'string') {
                    return dependencyValue.trim().toLowerCase() === ev.trim().toLowerCase();
                }
                return dependencyValue === ev;
            });
        }

        if (typeof expectedValue === 'boolean') {
            const normalized = normalizeBoolean(dependencyValue);
            if (normalized !== undefined) return normalized === expectedValue;
            return dependencyValue === expectedValue;
        }

        if (typeof expectedValue === 'string') {
            if (typeof dependencyValue === 'string') {
                return dependencyValue.trim().toLowerCase() === expectedValue.trim().toLowerCase();
            }
            return false;
        }

        return dependencyValue === expectedValue;
    };

    const handleAddCustomParameter = (): void => {
        if (isPreview || !onParameterAdd) return;

        const newParameter = createCustomParameter();
        onParameterAdd(nodeId, newParameter);
    };

    const handleDuplicateParameter = (param: Parameter): void => {
        if (isPreview || !onParameterAdd) return;

        const newParameter = duplicateParameter(param);
        onParameterAdd(nodeId, newParameter);
    };

    const renderParameter = (param: Parameter) => {
        if (!isDependencySatisfied(param)) {
            return null;
        }

        const parameterType = detectParameterType(param);
        const paramKey = `${nodeId}-${param.id}`;

        const isApiParam = param.is_api && param.api_name;
        const isLoadingOptions = apiParamsHook.loadingApiOptions[paramKey] || false;
        const isDuplicateable = param.duplicateable;
        const isDuplicated = param.id.includes('__add__');

        const localizedDesc = getParamDescription(param);
        const parameterLabel = (
            <span className={styles.paramKey}>
                {localizedDesc && localizedDesc.trim() !== '' && (
                    <div
                        className={styles.infoIcon}
                        onMouseEnter={() => setHoveredParam(param.id)}
                        onMouseLeave={() => setHoveredParam(null)}
                    >
                        <FiInfo size={24} />
                        {hoveredParam === param.id && (
                            <div className={styles.tooltip}>
                                {localizedDesc}
                            </div>
                        )}
                    </div>
                )}
                <span className={`${styles.paramName} ${param.required ? styles.required : ''}`}>
                    {param.name}
                </span>
                {isApiParam && (
                    <button
                        className={`${styles.refreshButton} ${isLoadingOptions ? styles.loading : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            apiParamsHook.refreshApiOptions(param, nodeId);
                        }}
                        disabled={isLoadingOptions}
                        title="Refresh options"
                        type="button"
                    >
                        <LuRefreshCw />
                    </button>
                )}
                {isDuplicateable && (
                    <button
                        className={styles.refreshButton}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateParameter(param);
                        }}
                        title="Duplicate parameter"
                        type="button"
                    >
                        <LuCopy />
                    </button>
                )}
                {isDuplicated && onParameterDelete && (
                    <button
                        className={styles.deleteButton}
                        onClick={(e) => {
                            e.stopPropagation();
                            onParameterDelete(nodeId, param.id);
                        }}
                        title="Delete parameter"
                        type="button"
                    >
                        <LuTrash2 />
                    </button>
                )}
            </span>
        );

        const renderParameterInput = () => {
            // Handle parameter type
            if (parameterType === 'handle') {
                const isEditing = paramEditingHook.editingHandleParams[paramKey] || false;
                const editingValue = paramEditingHook.editingHandleValues[paramKey] || '';

                return (
                    <div className={styles.handleParam}>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editingValue}
                                onChange={(e) => {
                                    paramEditingHook.handleHandleParamChange(e, param, nodeId);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        paramEditingHook.handleHandleParamSubmit(param, nodeId, onParameterNameChange);
                                    } else if (e.key === 'Escape') {
                                        paramEditingHook.handleHandleParamCancel(param, nodeId);
                                    }
                                    e.stopPropagation();
                                }}
                                onBlur={() => paramEditingHook.handleHandleParamSubmit(param, nodeId, onParameterNameChange)}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                                className={styles.paramInput}
                                autoFocus
                            />
                        ) : (
                            <span
                                className={styles.handleParamName}
                                onClick={() => paramEditingHook.handleHandleParamClick(param, nodeId)}
                            >
                                {param.name}
                            </span>
                        )}
                        <input
                            type="text"
                            value={param.value !== undefined && param.value !== null ? param.value.toString() : ''}
                            onChange={(e) => {
                                if (onParameterChange) {
                                    onParameterChange(nodeId, param.id, e.target.value);
                                }
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            onFocus={(e) => { e.stopPropagation(); if (onClearSelection) onClearSelection(); }}
                            onKeyDown={(e) => e.stopPropagation()}
                            onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            draggable={false}
                            className={`${styles.paramInput} paramInput`}
                        />
                        {isDuplicated && onParameterDelete && (
                            <button
                                className={styles.deleteButton}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onParameterDelete(nodeId, param.id);
                                }}
                                title="Delete parameter"
                                type="button"
                            >
                                <LuTrash2 />
                            </button>
                        )}
                    </div>
                );
            }

            // Boolean parameter
            if (parameterType === 'boolean') {
                const boolValue = typeof param.value === 'boolean' ? param.value :
                    typeof param.value === 'string' ? param.value.toLowerCase() === 'true' : false;
                return (
                    <div
                        className={styles.booleanParam}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ToggleSwitch
                            checked={boolValue}
                            onChange={(checked) => {
                                if (onParameterChange) {
                                    onParameterChange(nodeId, param.id, checked);
                                }
                            }}
                            disabled={isPreview}
                            size="sm"
                            color={boolValue ? 'green' : 'gray'}
                            showStateLabel
                            onLabel="True"
                            offLabel="False"
                        />
                    </div>
                );
            }

            // Options/Select parameter (API or static options)
            if (param.options && param.options.length > 0) {
                let effectiveOptions = param.options;
                if (isApiParam) {
                    effectiveOptions = apiParamsHook.apiOptions[paramKey] || param.options;
                }
                return (
                    <select
                        value={param.value !== undefined && param.value !== null ? param.value.toString() : ''}
                        onChange={(e) => {
                            if (onParameterChange) {
                                onParameterChange(nodeId, param.id, e.target.value);
                            }
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => { e.stopPropagation(); if (onClearSelection) onClearSelection(); }}
                        onKeyDown={(e) => e.stopPropagation()}
                        className={styles.paramSelect}
                        disabled={isPreview}
                    >
                        <option value="">-- Select --</option>
                        {effectiveOptions.map((opt) => (
                            <option key={String(opt.value)} value={String(opt.value)}>
                                {String(opt.label ?? opt.value)}
                            </option>
                        ))}
                    </select>
                );
            }

            // Expandable parameter
            if (parameterType === 'expandable') {
                const displayValue = param.value !== undefined && param.value !== null ? param.value.toString() : '';
                return (
                    <div className={styles.expandableWrapper}>
                        <input
                            type="text"
                            value={displayValue}
                            onChange={(e) => {
                                if (onParameterChange) {
                                    onParameterChange(nodeId, param.id, e.target.value);
                                }
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            onFocus={(e) => { e.stopPropagation(); if (onClearSelection) onClearSelection(); }}
                            onKeyDown={(e) => e.stopPropagation()}
                            onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            draggable={false}
                            className={`${styles.paramInput} paramInput`}
                            placeholder="Click expand to edit..."
                            disabled={isPreview}
                        />
                        {onOpenNodeModal && (
                            <button
                                className={styles.expandButton}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenNodeModal(nodeId, param.id, param.name, displayValue);
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                type="button"
                                title="Edit in modal"
                            >
                                ⤢
                            </button>
                        )}
                    </div>
                );
            }

            // Default text input
            return (
                <input
                    type="text"
                    value={param.value !== undefined && param.value !== null ? param.value.toString() : ''}
                    onChange={(e) => {
                        if (onParameterChange) {
                            onParameterChange(nodeId, param.id, e.target.value);
                        }
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => { e.stopPropagation(); if (onClearSelection) onClearSelection(); }}
                    onKeyDown={(e) => e.stopPropagation()}
                    onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    draggable={false}
                    className={`${styles.paramInput} paramInput`}
                    disabled={isPreview}
                />
            );
        };

        return (
            <div key={param.id} className={`${styles.param} param`}>
                {parameterType !== 'handle' && parameterLabel}
                {renderParameterInput()}
            </div>
        );
    };

    if (!parameters || parameters.length === 0) {
        return null;
    }

    return (
        <div className={styles.paramSection}>
            <div className={styles.parameterSectionHeader}>
                <span className={styles.parameterHeaderLabel}>PARAMETER</span>
                {!isPreview && onParameterAdd && (
                    <button
                        className={styles.addParameterButton}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleAddCustomParameter();
                        }}
                        type="button"
                        title="Add custom parameter"
                    >
                        <LuPlus />
                    </button>
                )}
            </div>

            {/* Basic Parameters */}
            {basicParameters.map(param => renderParameter(param))}

            {/* Advanced Parameters */}
            {hasAdvancedParams && (
                <div className={styles.advancedParams}>
                    <div
                        className={styles.advancedHeader}
                        onClick={onToggleAdvanced}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                onToggleAdvanced(e as any);
                            }
                        }}
                        role="button"
                        tabIndex={0}
                    >
                        <span>Advanced {showAdvanced ? '▲' : '▼'}</span>
                    </div>
                    {showAdvanced && advancedParameters.map(param => renderParameter(param))}
                </div>
            )}
        </div>
    );
};
