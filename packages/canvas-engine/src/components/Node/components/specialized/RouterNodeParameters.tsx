import React, { useMemo, useCallback } from 'react';
import { LuTrash2 } from '@xgen/icons';
import styles from '../../../../styles/Node.module.scss';
import { useTranslation } from '@xgen/i18n';
import type { Parameter } from '@xgen/canvas-types';

export interface RouterNodeParametersProps {
    nodeId: string;
    parameters: Parameter[];
    isPreview?: boolean;
    onParameterChange?: (nodeId: string, paramId: string, value: Parameter['value']) => void;
    onParameterDelete?: (nodeId: string, paramId: string) => void;
    onClearSelection?: () => void;
}

export const RouterNodeParameters: React.FC<RouterNodeParametersProps> = ({
    nodeId,
    parameters,
    isPreview = false,
    onParameterChange,
    onParameterDelete,
    onClearSelection
}) => {
    const { t } = useTranslation();

    const routerParameters = useMemo(() => {
        return (parameters ?? []).filter(
            (p) => !p.is_handle && p.name !== '__router_config__'
        );
    }, [parameters]);

    const handleParameterChange = useCallback(
        (paramId: string, value: Parameter['value']) => {
            if (onParameterChange) {
                onParameterChange(nodeId, paramId, value);
            }
        },
        [nodeId, onParameterChange]
    );

    const handleDeleteParameter = useCallback(
        (paramId: string) => {
            if (onParameterDelete) {
                onParameterDelete(nodeId, paramId);
            }
        },
        [nodeId, onParameterDelete]
    );

    if (routerParameters.length === 0) {
        return null;
    }

    return (
        <div className={styles.paramSection}>
            <div className={styles.parameterSectionHeader}>
                <span className={styles.parameterHeaderLabel}>
                    {t('canvas.node.parameters', 'PARAMETERS')}
                </span>
            </div>
            {routerParameters.map((param) => {
                const isDuplicated = param.id.includes('__add__');
                const hasOptions = param.options && param.options.length > 0;

                return (
                    <div key={param.id} className={`${styles.param} param`}>
                        <span className={styles.paramKey}>
                            <span className={`${styles.paramName} ${param.required ? styles.required : ''}`}>
                                {param.name}
                            </span>
                            {isDuplicated && onParameterDelete && (
                                <button
                                    className={styles.deleteButton}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteParameter(param.id);
                                    }}
                                    title={t('canvas.node.deleteParam', 'Delete parameter')}
                                    type="button"
                                >
                                    <LuTrash2 size={12} />
                                </button>
                            )}
                        </span>
                        {hasOptions ? (
                            <select
                                value={param.value !== undefined && param.value !== null ? String(param.value) : ''}
                                onChange={(e) => handleParameterChange(param.id, e.target.value)}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                                onFocus={(e) => {
                                    e.stopPropagation();
                                    if (onClearSelection) onClearSelection();
                                }}
                                onKeyDown={(e) => e.stopPropagation()}
                                className={styles.paramSelect}
                                disabled={isPreview}
                            >
                                <option value="">-- Select --</option>
                                {param.options!.map((opt) => (
                                    <option key={String(opt.value)} value={String(opt.value)}>
                                        {String(opt.label ?? opt.value)}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                value={param.value !== undefined && param.value !== null ? String(param.value) : ''}
                                onChange={(e) => handleParameterChange(param.id, e.target.value)}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                                onFocus={(e) => {
                                    e.stopPropagation();
                                    if (onClearSelection) onClearSelection();
                                }}
                                onKeyDown={(e) => e.stopPropagation()}
                                onDragStart={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                draggable={false}
                                className={`${styles.paramInput} paramInput`}
                                disabled={isPreview}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};
