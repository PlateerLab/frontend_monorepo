import { useState, useEffect } from 'react';
import type { Parameter, ParameterOption } from '@xgen/canvas-types';
import type { UseApiParametersReturn } from '../../components/Node/types';

/**
 * Hook for managing API-based parameter options.
 * The fetchParameterOptions function must be provided externally
 * to decouple from specific API implementations.
 */
export const useApiParameters = (
    nodeDataId: string,
    nodeId: string,
    parameters?: Parameter[],
    onParameterChange?: (nodeId: string, paramId: string, value: string | number | boolean, skipHistory?: boolean) => void,
    fetchParameterOptions?: (nodeDataId: string, apiName: string) => Promise<ParameterOption[]>
): UseApiParametersReturn => {
    const [apiOptions, setApiOptions] = useState<Record<string, ParameterOption[]>>({});
    const [loadingApiOptions, setLoadingApiOptions] = useState<Record<string, boolean>>({});
    const [apiSingleValues, setApiSingleValues] = useState<Record<string, string>>({});

    const loadApiOptions = async (param: Parameter, nodeId: string) => {
        if (!param.is_api || !param.api_name || !nodeDataId || !fetchParameterOptions) return;
        const paramKey = `${nodeId}-${param.id}`;
        if (loadingApiOptions[paramKey] || apiOptions[paramKey] || apiSingleValues[paramKey]) return;
        setLoadingApiOptions(prev => ({ ...prev, [paramKey]: true }));
        try {
            const options = await fetchParameterOptions(nodeDataId, param.api_name);
            if (options.length === 1 && (options[0] as any).isSingleValue) {
                const singleValue = String(options[0].value);
                setApiSingleValues(prev => ({ ...prev, [paramKey]: singleValue }));
                if ((param.value === undefined || param.value === null || param.value === '') && onParameterChange) {
                    onParameterChange(nodeId, param.id, singleValue, true);
                }
            } else {
                setApiOptions(prev => ({ ...prev, [paramKey]: options }));
            }
        } catch (error) {
            console.error('Error loading API options for parameter:', param.name, error);
        } finally {
            setLoadingApiOptions(prev => ({ ...prev, [paramKey]: false }));
        }
    };

    const refreshApiOptions = async (param: Parameter, nodeId: string) => {
        if (!param.is_api || !param.api_name || !nodeDataId || !fetchParameterOptions) return;
        const paramKey = `${nodeId}-${param.id}`;
        if (loadingApiOptions[paramKey]) return;
        setLoadingApiOptions(prev => ({ ...prev, [paramKey]: true }));
        try {
            setApiOptions(prev => { const n = { ...prev }; delete n[paramKey]; return n; });
            setApiSingleValues(prev => { const n = { ...prev }; delete n[paramKey]; return n; });
            const options = await fetchParameterOptions(nodeDataId, param.api_name);
            if (options.length === 1 && (options[0] as any).isSingleValue) {
                const singleValue = String(options[0].value);
                setApiSingleValues(prev => ({ ...prev, [paramKey]: singleValue }));
                if (onParameterChange) {
                    onParameterChange(nodeId, param.id, singleValue, true);
                }
            } else {
                setApiOptions(prev => ({ ...prev, [paramKey]: options }));
            }
        } catch (error) {
            console.error('Error refreshing API options for parameter:', param.name, error);
        } finally {
            setLoadingApiOptions(prev => ({ ...prev, [paramKey]: false }));
        }
    };

    useEffect(() => {
        if (!parameters || !nodeDataId || !fetchParameterOptions) return;
        parameters.forEach(param => {
            if (param.is_api && param.api_name) {
                loadApiOptions(param, nodeDataId);
            }
        });
    }, [parameters, nodeDataId]);

    return { apiOptions, loadingApiOptions, apiSingleValues, loadApiOptions, refreshApiOptions };
};
