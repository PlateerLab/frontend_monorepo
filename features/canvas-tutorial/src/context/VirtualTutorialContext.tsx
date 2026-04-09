'use client';

import React, { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import type { VirtualTutorialState, VirtualTutorialScenario, VirtualTutorialStep } from '../virtual-cursor-types';
import { markScenarioCompleted, getCompletedScenarios } from '../utils/storage';

interface VirtualTutorialContextValue {
    state: VirtualTutorialState;
    currentStep: VirtualTutorialStep | null;
    currentScenario: VirtualTutorialScenario | null;
    scenarios: VirtualTutorialScenario[];
    start: (scenarioId: string) => void;
    next: () => void;
    prev: () => void;
    skip: () => void;
    reset: () => void;
}

type Action =
    | { type: 'START'; scenarioId: string }
    | { type: 'NEXT' }
    | { type: 'PREV' }
    | { type: 'SKIP' }
    | { type: 'COMPLETE' }
    | { type: 'RESET' };

function reducer(
    state: VirtualTutorialState,
    action: Action,
    scenarios: VirtualTutorialScenario[],
): VirtualTutorialState {
    switch (action.type) {
        case 'START': {
            return {
                ...state,
                isActive: true,
                currentScenarioId: action.scenarioId,
                currentStepIndex: 0,
            };
        }
        case 'NEXT': {
            const scenario = scenarios.find((s) => s.id === state.currentScenarioId);
            if (!scenario) return state;
            const nextIndex = state.currentStepIndex + 1;
            if (nextIndex >= scenario.steps.length) {
                markScenarioCompleted(scenario.id);
                return {
                    ...state,
                    isActive: false,
                    currentScenarioId: null,
                    currentStepIndex: 0,
                    completedScenarios: [...state.completedScenarios, scenario.id],
                };
            }
            return { ...state, currentStepIndex: nextIndex };
        }
        case 'PREV': {
            if (state.currentStepIndex <= 0) return state;
            return { ...state, currentStepIndex: state.currentStepIndex - 1 };
        }
        case 'SKIP':
            return {
                ...state,
                isActive: false,
                currentScenarioId: null,
                currentStepIndex: 0,
            };
        case 'COMPLETE': {
            const scenario = scenarios.find((s) => s.id === state.currentScenarioId);
            if (scenario) markScenarioCompleted(scenario.id);
            return {
                ...state,
                isActive: false,
                currentScenarioId: null,
                currentStepIndex: 0,
                completedScenarios: scenario
                    ? [...state.completedScenarios, scenario.id]
                    : state.completedScenarios,
            };
        }
        case 'RESET':
            return {
                isActive: false,
                currentScenarioId: null,
                currentStepIndex: 0,
                completedScenarios: [],
            };
        default:
            return state;
    }
}

const Context = createContext<VirtualTutorialContextValue | null>(null);

interface ProviderProps {
    children: ReactNode;
    scenarios: VirtualTutorialScenario[];
}

export const VirtualTutorialProvider: React.FC<ProviderProps> = ({ children, scenarios }) => {
    const [state, rawDispatch] = useReducer(
        (s: VirtualTutorialState, a: Action) => reducer(s, a, scenarios),
        {
            isActive: false,
            currentScenarioId: null,
            currentStepIndex: 0,
            completedScenarios: getCompletedScenarios(),
        },
    );

    const currentScenario = scenarios.find((s) => s.id === state.currentScenarioId) ?? null;
    const currentStep = currentScenario?.steps[state.currentStepIndex] ?? null;

    const start = useCallback((scenarioId: string) => rawDispatch({ type: 'START', scenarioId }), []);
    const next = useCallback(() => rawDispatch({ type: 'NEXT' }), []);
    const prev = useCallback(() => rawDispatch({ type: 'PREV' }), []);
    const skip = useCallback(() => rawDispatch({ type: 'SKIP' }), []);
    const reset = useCallback(() => rawDispatch({ type: 'RESET' }), []);

    return (
        <Context.Provider value={{ state, currentStep, currentScenario, scenarios, start, next, prev, skip, reset }}>
            {children}
        </Context.Provider>
    );
};

export function useVirtualTutorial(): VirtualTutorialContextValue {
    const ctx = useContext(Context);
    if (!ctx) throw new Error('useVirtualTutorial must be used within VirtualTutorialProvider');
    return ctx;
}
