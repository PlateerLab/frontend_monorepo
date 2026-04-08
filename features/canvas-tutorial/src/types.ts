import type { CanvasNode, CanvasEdge, View } from '@xgen/canvas-types';

export interface TutorialStep {
    step: number;
    title: string;
    message: string;
    nodes: CanvasNode[];
    edges: CanvasEdge[];
}

export interface TutorialData {
    tutorial_id: string;
    tutorial_name: string;
    tutorial_description: string;
    tags: string[];
    tutorial_steps: TutorialStep[];
    view: View;
}
