import React, { useState, useMemo } from 'react';
import { LuDownload } from '@xgen/icons';
import styles from '../../../styles/Node.module.scss';
import { generatePortKey, getConnectedSchemaProvider, getPortTypeDisplay } from '../utils/nodeUtils';
import { filterPortsByDependency } from '../utils/portUtils';
import { getLocalizedPortDescription } from '../utils/parameterUtils';
import { isMultiType, getPrimaryType } from '../../../utils/canvas-utils';
import { useTranslation } from '@xgen/i18n';
import type { NodePortsProps } from '../types';

export const NodePorts: React.FC<NodePortsProps> = ({
    nodeId,
    inputs,
    outputs,
    parameters,
    isPreview = false,
    isSelected,
    onPortMouseDown,
    onPortMouseUp,
    registerPortRef,
    snappedPortKey,
    isSnapTargetInvalid,
    currentNodes,
    currentEdges,
    onSynchronizeSchema
}) => {
    const [hoveredPort, setHoveredPort] = useState<string | null>(null);
    const { locale } = useTranslation();

    const filteredInputs = useMemo(() => filterPortsByDependency(inputs, parameters), [inputs, parameters]);
    const filteredOutputs = useMemo(() => filterPortsByDependency(outputs, parameters), [outputs, parameters]);

    const hasInputs = filteredInputs && filteredInputs.length > 0;
    const hasOutputs = filteredOutputs && filteredOutputs.length > 0;
    const hasOnlyOutputs = hasOutputs && !hasInputs;

    const handleSynchronizeSchema = (portId: string) => {
        if (!onSynchronizeSchema) return;
        onSynchronizeSchema(portId);
    };

    if (!hasInputs && !hasOutputs) {
        return null;
    }

    const showCombinedIoHeader = hasInputs && hasOutputs;

    return (
        <div className={styles.ioContainer}>
            {showCombinedIoHeader && (
                <div className={styles.ioHeaderRow}>
                    <span className={`typo-subtitle3 typo-colorGray600 ${styles.ioHeaderLabel}`}>INPUT</span>
                    <span className={`typo-subtitle3 typo-colorGray600 ${styles.ioHeaderLabel}`}>OUTPUT</span>
                </div>
            )}
            <div className={styles.ioColumns}>
            {hasInputs && (
                <div className={styles.column}>
                    {!showCombinedIoHeader && (
                        <div className={`typo-subtitle3 typo-colorGray600 ${styles.sectionHeader}`}>INPUT</div>
                    )}
                    {filteredInputs.map(portData => {
                        const portKey = generatePortKey(nodeId, portData.id, 'input');
                        const isSnapping = snappedPortKey === portKey;
                        const primaryType = getPrimaryType(portData.type) || portData.type;
                        const isMulti = isMultiType(portData.type);

                        const portClasses = [
                            styles.port,
                            styles.inputPort,
                            portData.multi ? styles.multi : '',
                            styles[`type-${primaryType}`],
                            isMulti ? styles.multiType : '',
                            isSnapping ? styles.snapping : '',
                            isSnapping && isSnapTargetInvalid ? styles['invalid-snap'] : ''
                        ].filter(Boolean).join(' ');

                        return (
                            <div key={portData.id} className={styles.portRow}>
                                <div
                                    ref={(el) => registerPortRef && registerPortRef(nodeId, portData.id, 'input', el)}
                                    className={portClasses}
                                    data-port-id={portData.id}
                                    onMouseDown={isPreview ? undefined : (e) => {
                                        e.stopPropagation();
                                        onPortMouseDown({
                                            nodeId: nodeId,
                                            portId: portData.id,
                                            portType: 'input',
                                            isMulti: portData.multi,
                                            type: portData.type
                                        }, e);
                                    }}
                                    onMouseUp={isPreview ? undefined : (e) => {
                                        e.stopPropagation();
                                        onPortMouseUp({
                                            nodeId: nodeId,
                                            portId: portData.id,
                                            portType: 'input',
                                            type: portData.type
                                        }, e);
                                    }}
                                    onMouseEnter={() => setHoveredPort(portData.id)}
                                    onMouseLeave={() => setHoveredPort(null)}
                                    style={hoveredPort === portData.id ? { zIndex: 50 } : undefined}
                                >
                                    {getPortTypeDisplay(portData.type)}
                                    {hoveredPort === portData.id && (() => { const desc = getLocalizedPortDescription(portData, locale); return desc ? <div className={styles.tooltip}>{desc}</div> : null; })()}
                                </div>
                                <span className={`${styles.portLabel} ${portData.required ? styles.required : ''}`}>
                                    {portData.name}
                                </span>
                                {portData.type === 'InputSchema' && !isPreview && getConnectedSchemaProvider(nodeId, portData.id, currentEdges, currentNodes) && (
                                    <button
                                        className={styles.downloadButton}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSynchronizeSchema(portData.id);
                                        }}
                                        type="button"
                                        title="Synchronize schema parameters"
                                    >
                                        <LuDownload />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            {hasOutputs && (
                <div className={`${styles.column} ${styles.outputColumn} ${hasOnlyOutputs ? styles.fullWidth : ''}`}>
                    {!showCombinedIoHeader && (
                        <div className={`typo-subtitle3 typo-colorGray600 ${styles.sectionHeader}`}>OUTPUT</div>
                    )}
                    {filteredOutputs.map(portData => {
                        const primaryType = getPrimaryType(portData.type) || portData.type;
                        const isMulti = isMultiType(portData.type);

                        const portClasses = [
                            styles.port,
                            styles.outputPort,
                            portData.multi ? styles.multi : '',
                            styles[`type-${primaryType}`],
                            isMulti ? styles.multiType : ''
                        ].filter(Boolean).join(' ');

                        return (
                            <div key={portData.id} className={`${styles.portRow} ${styles.outputRow}`}>
                                <span className={styles.portLabel}>
                                    {portData.name}
                                </span>
                                <div
                                    ref={(el) => registerPortRef && registerPortRef(nodeId, portData.id, 'output', el)}
                                    className={portClasses}
                                    data-port-id={portData.id}
                                    onMouseDown={isPreview ? undefined : (e) => {
                                        e.stopPropagation();
                                        onPortMouseDown({
                                            nodeId: nodeId,
                                            portId: portData.id,
                                            portType: 'output',
                                            isMulti: portData.multi,
                                            type: portData.type
                                        }, e);
                                    }}
                                    onMouseUp={isPreview ? undefined : (e) => {
                                        e.stopPropagation();
                                        onPortMouseUp({
                                            nodeId: nodeId,
                                            portId: portData.id,
                                            portType: 'output',
                                            type: portData.type
                                        }, e);
                                    }}
                                    onMouseEnter={() => setHoveredPort(portData.id + '-output')}
                                    onMouseLeave={() => setHoveredPort(null)}
                                    style={hoveredPort === portData.id + '-output' ? { zIndex: 50 } : undefined}
                                >
                                    {getPortTypeDisplay(portData.type)}
                                    {hoveredPort === portData.id + '-output' && (() => { const desc = getLocalizedPortDescription(portData, locale); return desc ? <div className={styles.tooltip}>{desc}</div> : null; })()}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            </div>
        </div>
    );
};
