import React, { useMemo, useCallback, useState } from 'react';
import { LuTrash2, LuPlus } from '@xgen/icons';
import styles from '../../../../styles/Node.module.scss';
import { useTranslation } from '@xgen/i18n';
import { getLocalizedDescription } from '../../utils/parameterUtils';
import type { Parameter } from '@xgen/canvas-types';

export interface SchemaProviderNodeParametersProps {
    nodeId: string;
    parameters: Parameter[];
    isPreview?: boolean;
    bodyType?: string;
    onParameterChange?: (nodeId: string, paramId: string, value: Parameter['value']) => void;
    onParameterAdd?: (nodeId: string, parameter: Parameter) => void;
    onParameterDelete?: (nodeId: string, paramId: string) => void;
    onClearSelection?: () => void;
}

const BODY_TYPE_PARAM_ID = 'body_type';
const BODY_TYPES = ['json', 'form-data', 'x-www-form-urlencoded', 'raw', 'none'] as const;

const SECTION_ORDER = ['path', 'query', 'header', 'body'] as const;

interface SectionParameter {
    param: Parameter;
    section: string;
}

export const SchemaProviderNodeParameters: React.FC<SchemaProviderNodeParametersProps> = ({
    nodeId,
    parameters,
    isPreview = false,
    bodyType: initialBodyType,
    onParameterChange,
    onParameterAdd,
    onParameterDelete,
    onClearSelection
}) => {
    const { t, locale } = useTranslation();
    const [hoveredParam, setHoveredParam] = useState<string | null>(null);

    const bodyType = useMemo(() => {
        const bodyTypeParam = (parameters ?? []).find((p) => p.id === BODY_TYPE_PARAM_ID);
        return bodyTypeParam?.value?.toString() ?? initialBodyType ?? 'json';
    }, [parameters, initialBodyType]);

    const sectionedParams = useMemo(() => {
        const sections: Record<string, SectionParameter[]> = {
            path: [],
            query: [],
            header: [],
            body: []
        };

        (parameters ?? []).forEach((param) => {
            if (param.id === BODY_TYPE_PARAM_ID) return;
            if (param.is_handle) return;

            const section = param.section ?? 'body';
            if (sections[section]) {
                sections[section].push({ param, section });
            } else {
                sections.body.push({ param, section: 'body' });
            }
        });

        // Filter body params based on body type
        if (bodyType === 'none') {
            sections.body = [];
        }

        return sections;
    }, [parameters, bodyType]);

    const handleParameterChange = useCallback(
        (paramId: string, value: Parameter['value']) => {
            if (onParameterChange) {
                onParameterChange(nodeId, paramId, value);
            }
        },
        [nodeId, onParameterChange]
    );

    const handleBodyTypeChange = useCallback(
        (value: string) => {
            if (onParameterChange) {
                onParameterChange(nodeId, BODY_TYPE_PARAM_ID, value);
            }
        },
        [nodeId, onParameterChange]
    );

    const handleAddParameter = useCallback(
        (section: string) => {
            if (!onParameterAdd || isPreview) return;
            const timestamp = Date.now();
            const newParam: Parameter = {
                id: `custom_${section}_${timestamp}`,
                name: `new_${section}_param`,
                type: 'string',
                value: '',
                required: false,
                section,
                is_handle: false
            };
            onParameterAdd(nodeId, newParam);
        },
        [nodeId, isPreview, onParameterAdd]
    );

    const handleDeleteParameter = useCallback(
        (paramId: string) => {
            if (!onParameterDelete || isPreview) return;

            // For paired parameters (key-value), delete both
            const pairedId = paramId.endsWith('_key')
                ? paramId.replace(/_key$/, '_value')
                : paramId.endsWith('_value')
                    ? paramId.replace(/_value$/, '_key')
                    : null;

            onParameterDelete(nodeId, paramId);
            if (pairedId) {
                const pairedParam = (parameters ?? []).find((p) => p.id === pairedId);
                if (pairedParam) {
                    onParameterDelete(nodeId, pairedId);
                }
            }
        },
        [nodeId, isPreview, parameters, onParameterDelete]
    );

    const renderParameterInput = (param: Parameter) => {
        const hasOptions = param.options && param.options.length > 0;
        const localizedDesc = getLocalizedDescription(param, locale);

        return (
            <div key={param.id} className={`${styles.param} param`}>
                <span className={styles.paramKey}>
                    {localizedDesc && localizedDesc.trim() !== '' && (
                        <div
                            className={styles.infoIcon}
                            onMouseEnter={() => setHoveredParam(param.id)}
                            onMouseLeave={() => setHoveredParam(null)}
                        >
                            <span style={{ width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>ℹ</span>
                            {hoveredParam === param.id && (
                                <div className={styles.tooltip}>{localizedDesc}</div>
                            )}
                        </div>
                    )}
                    <span className={`${styles.paramName} ${param.required ? styles.required : ''}`}>
                        {param.name}
                    </span>
                    {!param.required && !isPreview && onParameterDelete && (
                        <button
                            className={styles.deleteButton}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteParameter(param.id);
                            }}
                            title={t('canvas.node.deleteParam', 'Delete')}
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
    };

    const renderSection = (sectionName: string, sectionParams: SectionParameter[]) => {
        if (sectionName === 'body' && bodyType === 'none') return null;

        const sectionLabel = sectionName.toUpperCase();

        return (
            <div key={sectionName} className={styles.paramSubSection}>
                <div className={styles.parameterSectionHeader}>
                    <span className={styles.parameterHeaderLabel}>{sectionLabel}</span>
                    {!isPreview && onParameterAdd && (
                        <button
                            className={styles.addParameterButton}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAddParameter(sectionName);
                            }}
                            title={t('canvas.node.addParam', `Add ${sectionName} parameter`)}
                            type="button"
                        >
                            <LuPlus size={12} />
                        </button>
                    )}
                </div>
                {sectionParams.length === 0 ? (
                    <div className={styles.emptySection}>
                        {t('canvas.node.noParams', 'No parameters')}
                    </div>
                ) : (
                    sectionParams.map((sp) => renderParameterInput(sp.param))
                )}
            </div>
        );
    };

    return (
        <div className={styles.paramSection}>
            <div className={styles.parameterSectionHeader}>
                <span className={styles.parameterHeaderLabel}>
                    {t('canvas.node.parameters', 'PARAMETERS')}
                </span>
            </div>

            {/* Body Type Selector */}
            <div className={`${styles.param} param`}>
                <span className={styles.paramKey}>
                    <span className={`${styles.paramName} ${styles.required}`}>
                        {t('canvas.node.bodyType', 'Body Type')}
                    </span>
                </span>
                <select
                    value={bodyType}
                    onChange={(e) => handleBodyTypeChange(e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    className={styles.paramSelect}
                    disabled={isPreview}
                >
                    {BODY_TYPES.map((bt) => (
                        <option key={bt} value={bt}>
                            {bt}
                        </option>
                    ))}
                </select>
            </div>

            {/* Sections */}
            {SECTION_ORDER.map((section) =>
                renderSection(section, sectionedParams[section] ?? [])
            )}
        </div>
    );
};
