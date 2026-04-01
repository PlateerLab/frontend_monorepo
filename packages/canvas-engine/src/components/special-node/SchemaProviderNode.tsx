import React, { useMemo, memo, useCallback } from 'react';
import { Node } from '../Node/index';
import { SchemaProviderNodeParameters } from '../Node/components/specialized/SchemaProviderNodeParameters';
import type { NodeComponentProps } from '../Node/index';
import type { Parameter } from '@xgen/canvas-types';

/**
 * SchemaProviderNode - Extends the base Node component with schema
 * synchronization capabilities and body-type-aware parameter rendering.
 */
export interface SchemaProviderNodeProps extends NodeComponentProps {
    /** Request schema sync from connected API endpoint */
    onSchemaSyncRequest?: (nodeId: string) => void;
}

const SchemaProviderNodeComponent: React.FC<SchemaProviderNodeProps> = ({
    node,
    onSchemaSyncRequest,
    onParameterChange,
    onParameterAdd,
    onParameterDelete,
    onClearSelection,
    isPreview,
    ...restProps
}) => {
    const parameters = node.data?.parameters ?? [];
    const isCollapsed = node.isCollapsed ?? false;

    // Extract body type from parameters
    const bodyType = useMemo(() => {
        const bodyTypeParam = parameters.find((p) => p.id === 'body_type');
        return bodyTypeParam?.value?.toString() ?? 'json';
    }, [parameters]);

    return (
        <Node
            node={node}
            isPreview={isPreview}
            onParameterChange={onParameterChange}
            onParameterAdd={onParameterAdd}
            onParameterDelete={onParameterDelete}
            onClearSelection={onClearSelection}
            onSchemaSyncRequest={onSchemaSyncRequest}
            {...restProps}
        >
            {/* Override parameters with SchemaProviderNodeParameters */}
            {!isCollapsed && (
                <SchemaProviderNodeParameters
                    nodeId={node.id}
                    parameters={parameters}
                    isPreview={isPreview}
                    bodyType={bodyType}
                    onParameterChange={onParameterChange}
                    onParameterAdd={onParameterAdd}
                    onParameterDelete={onParameterDelete}
                    onClearSelection={onClearSelection}
                />
            )}
        </Node>
    );
};

export const SchemaProviderNode = memo(SchemaProviderNodeComponent);
