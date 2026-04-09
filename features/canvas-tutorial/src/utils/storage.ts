const STORAGE_KEY = 'xgen_tutorial_completed';

export function getCompletedScenarios(): string[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function markScenarioCompleted(scenarioId: string): void {
    const completed = getCompletedScenarios();
    if (!completed.includes(scenarioId)) {
        completed.push(scenarioId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
    }
}

export function isScenarioCompleted(scenarioId: string): boolean {
    return getCompletedScenarios().includes(scenarioId);
}

export function resetTutorialProgress(): void {
    localStorage.removeItem(STORAGE_KEY);
}
