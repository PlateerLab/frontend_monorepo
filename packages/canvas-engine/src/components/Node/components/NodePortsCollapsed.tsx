import React, { useMemo } from 'react';
import styles from '../../../styles/Node.module.scss';
import { generatePortKey, getPortTypeDisplay } from '../utils/nodeUtils';
import { filterPortsByDependency } from '../utils/portUtils';
import { getLocalizedPortDescription } from '../utils/parameterUtils';
import { isMultiType, getPrimaryType } from '../../../utils/canvas-utils';
import { useTranslation } from '@xgen/i18n';
import type { NodePortsProps } from '../types';

export const NodePortsCollapsed: React.FC<NodePortsProps> = ({
    nodeId,
    inputs,
    outputs,
    parameters,
    isPreview = false,
    onPortMouseDown,
    onPortMouseUp,
    registerPortRef,
    snappedPortKey,
    isSnapTargetInvalid
}) => {
    const { locale } = useTranslation();

    const filteredInputs = useMemo(() => filterPortsByDependency(inputs, parameters), [inputs, parameters]);
    const filteredOutputs = useMemo(() => filterPortsByDependency(outputs, parameters), [outputs, parameters]);

    const hasInputs = filteredInputs && filteredInputs.length > 0;
    const hasOutputs = filteredOutputs && filteredOutputs.length > 0;

    if (!hasInputs && !hasOutputs) {
        return null;
    }

    return (
        <div className={styles.collapsedPorts}>
            {/* Input ports - left */}
            <div className={styles.collapsedInputs}>
                {hasInputs && filteredInputs?.map((input) => {
                    const portKey = generatePortKey(nodeId, input.id, 'input');
                    const isSnapping = snappedPortKey === portKey;
                    const primaryType = getPrimaryType(input.type) || input.type;
                    const isMulti = isMultiType(input.type);

                    return (
                        <div
                            key={input.id}
                            className={styles.collapsedPortItem}
                        >
                            <div
                                className={`${styles.collapsedPortCircle} ${styles[`type-${primaryType}`]} ${
                                    input.multi ? styles.multi : ''
                                } ${
                                    isMulti ? styles.multiType : ''
                                } ${
                                    isSnapping
                                        ? (isSnapTargetInvalid ? styles['invalid-snap'] : styles.snapping)
                                        : ''
                                }`}
                                ref={(el) => registerPortRef(nodeId, input.id, 'input', el)}
                                onMouseDown={(e) => {
                                    if (isPreview) return;
                                    e.stopPropagation();
                                    onPortMouseDown({
                                        nodeId: nodeId,
                                        portId: input.id,
                                        portType: 'input',
                                        isMulti: input.multi,
                                        type: input.type
                                    }, e);
                                }}
                                onMouseUp={(e) => {
                                    if (isPreview) return;
                                    e.stopPropagation();
                                    onPortMouseUp({
                                        nodeId: nodeId,
                                        portId: input.id,
                                        portType: 'input',
                                        isMulti: input.multi,
                                        type: input.type
                                    }, e);
                                }}
                                title={(() => { const desc = getLocalizedPortDescription(input, locale); return desc ? `${input.name} (${input.type}) - ${desc}` : `${input.name} (${input.type})`; })()}
                            />
                            <span className={styles.collapsedPortType}>{getPortTypeDisplay(input.type)}</span>
                        </div>
                    );
                })}
            </div>

            {/* Output ports - right */}
            <div className={styles.collapsedOutputs}>
                {hasOutputs && filteredOutputs?.map((output) => {
                    const portKey = generatePortKey(nodeId, output.id, 'output');
                    const isSnapping = snappedPortKey === portKey;
                    const primaryType = getPrimaryType(output.type) || output.type;
                    const isMulti = isMultiType(output.type);

                    return (
                        <div
                            key={output.id}
                            className={styles.collapsedPortItem}
                        >
                            <span className={styles.collapsedPortType}>{getPortTypeDisplay(output.type)}</span>
                            <div
                                className={`${styles.collapsedPortCircle} ${styles[`type-${primaryType}`]} ${
                                    output.multi ? styles.multi : ''
                                } ${
                                    isMulti ? styles.multiType : ''
                                } ${
                                    isSnapping
                                        ? (isSnapTargetInvalid ? styles['invalid-snap'] : styles.snapping)
                                        : ''
                                }`}
                                ref={(el) => registerPortRef(nodeId, output.id, 'output', el)}
                                onMouseDown={(e) => {
                                    if (isPreview) return;
                                    e.stopPropagation();
                                    onPortMouseDown({
                                        nodeId: nodeId,
                                        portId: output.id,
                                        portType: 'output',
                                        isMulti: output.multi,
                                        type: output.type
                                    }, e);
                                }}
                                onMouseUp={(e) => {
                                    if (isPreview) return;
                                    e.stopPropagation();
                                    onPortMouseUp({
                                        nodeId: nodeId,
                                        portId: output.id,
                                        portType: 'output',
                                        isMulti: output.multi,
                                        type: output.type
                                    }, e);
                                }}
                                title={(() => { const desc = getLocalizedPortDescription(output, locale); return desc ? `${output.name} (${output.type}) - ${desc}` : `${output.name} (${output.type})`; })()}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
