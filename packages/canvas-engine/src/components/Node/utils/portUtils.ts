import type { Port, Parameter } from '@xgen/canvas-types';

export const createParameterValueMap = (parameters?: Parameter[]): Record<string, Parameter['value'] | undefined> => {
    const valueMap: Record<string, Parameter['value'] | undefined> = {};
    (parameters ?? []).forEach((param) => {
        valueMap[param.id] = param.value;
    });
    return valueMap;
};

export const normalizeBoolean = (value: Parameter['value'] | undefined): boolean | undefined => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true') return true;
        if (normalized === 'false') return false;
    }
    return undefined;
};

export const isPortDependencySatisfied = (
    port: Port,
    parameterValueMap: Record<string, Parameter['value'] | undefined>
): boolean => {
    if (!port.dependency) return true;

    const dependencyValue = parameterValueMap[port.dependency];
    const expectedValue = port.dependencyValue ?? true;

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

export const filterPortsByDependency = (
    ports: Port[] | undefined,
    parameters: Parameter[] | undefined
): Port[] => {
    if (!ports) return [];

    const parameterValueMap = createParameterValueMap(parameters);

    return ports.filter(port => isPortDependencySatisfied(port, parameterValueMap));
};
