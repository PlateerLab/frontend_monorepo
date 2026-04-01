import { useState, useCallback } from 'react';
import type { NodeData, CanvasNode } from '@xgen/canvas-types';

interface UseCompatibleNodesProps {
    availableNodeSpecs: NodeData[];
    areTypesCompatible: (sourceType?: string, targetType?: string) => boolean;
}

export interface UseCompatibleNodesReturn {
    /** Compatible node specs for the current drag context */
    compatibleNodes: NodeData[];
    setCompatibleNodes: React.Dispatch<React.SetStateAction<NodeData[]>>;
    isDraggingOutput: boolean;
    isDraggingInput: boolean;
    sourcePortForConnection: { nodeId: string; portId: string; portType: string; type: string } | null;
    setIsDraggingOutput: (value: boolean) => void;
    setIsDraggingInput: (value: boolean) => void;
    setCurrentOutputType: (value: string | null) => void;
    setCurrentInputType: (value: string | null) => void;
    setSourcePortForConnection: (value: { nodeId: string; portId: string; portType: string; type: string } | null) => void;
    /** Find nodes whose inputs accept the given output type */
    findCompatibleInputNodes: (outputType: string) => NodeData[];
    /** Find nodes whose outputs can feed the given input type */
    findCompatibleOutputNodes: (inputType: string) => NodeData[];
    /** Create a real CanvasNode from a selected NodeData */
    createNodeFromSpec: (nodeData: NodeData, position: { x: number; y: number }) => CanvasNode;
    /** Reset all state */
    clearCompatibleNodes: () => void;
}

export const useCompatibleNodes = ({
    availableNodeSpecs,
    areTypesCompatible,
}: UseCompatibleNodesProps): UseCompatibleNodesReturn => {
    const [compatibleNodes, setCompatibleNodes] = useState<NodeData[]>([]);
    const [isDraggingOutput, setIsDraggingOutput] = useState(false);
    const [isDraggingInput, setIsDraggingInput] = useState(false);
    const [currentOutputType, setCurrentOutputType] = useState<string | null>(null);
    const [currentInputType, setCurrentInputType] = useState<string | null>(null);
    const [sourcePortForConnection, setSourcePortForConnection] = useState<{
        nodeId: string;
        portId: string;
        portType: string;
        type: string;
    } | null>(null);

    const findCompatibleInputNodes = useCallback((outputType: string): NodeData[] => {
        return availableNodeSpecs.filter(nodeSpec => {
            if (!nodeSpec.inputs) return false;
            return nodeSpec.inputs.some(input => areTypesCompatible(outputType, input.type));
        });
    }, [availableNodeSpecs, areTypesCompatible]);

    const findCompatibleOutputNodes = useCallback((inputType: string): NodeData[] => {
        return availableNodeSpecs.filter(nodeSpec => {
            if (!nodeSpec.outputs) return false;
            return nodeSpec.outputs.some(output => areTypesCompatible(output.type, inputType));
        });
    }, [availableNodeSpecs, areTypesCompatible]);

    const createNodeFromSpec = useCallback((nodeData: NodeData, position: { x: number; y: number }): CanvasNode => {
        return {
            id: `${nodeData.id}-${Date.now()}`,
            data: nodeData,
            position,
            isExpanded: true,
        };
    }, []);

    const clearCompatibleNodes = useCallback(() => {
        setCompatibleNodes([]);
        setIsDraggingOutput(false);
        setIsDraggingInput(false);
        setCurrentOutputType(null);
        setCurrentInputType(null);
        setSourcePortForConnection(null);
    }, []);

    return {
        compatibleNodes,
        setCompatibleNodes,
        isDraggingOutput,
        isDraggingInput,
        sourcePortForConnection,
        setIsDraggingOutput,
        setIsDraggingInput,
        setCurrentOutputType,
        setCurrentInputType,
        setSourcePortForConnection,
        findCompatibleInputNodes,
        findCompatibleOutputNodes,
        createNodeFromSpec,
        clearCompatibleNodes,
    };
};
