import './locales';
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@xgen/i18n';
import type { CanvasPagePlugin } from '@xgen/types';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@xgen/ui';
import styles from './styles/auto-agentflow-sidebar.module.scss';

// ── Types ──────────────────────────────────────────────────────

export interface AgentNode {
    id: string;
    nodeName: string;
    description: string;
    tags: string[];
    inputs: Array<{ id: string; name: string; type: string }>;
    outputs: Array<{ id: string; name: string; type: string }>;
    parameters?: Array<{
        id: string;
        name: string;
        type: string;
        value: any;
        required?: boolean;
        options?: Array<{ value: string; label: string }>;
    }>;
}

export interface AutoAgentflowSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onLoadAgentflow: (workflowData: any) => void;
    getCanvasState?: () => any;
    /** Injected API: fetch available agent nodes */
    fetchAgentNodes?: () => Promise<AgentNode[]>;
    /** Injected API: generate workflow with AI */
    generateAgentflow?: (requestData: any) => Promise<any>;
    /** Injected API: fetch VLLM model info for a given node */
    fetchVllmModelInfo?: (nodeId: string) => Promise<{ model: string; base_url: string; temperature: number; max_tokens: number }>;
    /** Toast helpers — injected */
    showSuccess?: (msg: string) => void;
    showError?: (msg: string) => void;
    showLoading?: (msg: string) => string;
    dismissLoading?: (id: string) => void;
}

// ── Component ──────────────────────────────────────────────────

const AutoAgentflowSidebar: React.FC<AutoAgentflowSidebarProps> = ({
    isOpen,
    onClose,
    onLoadAgentflow,
    getCanvasState,
    fetchAgentNodes,
    generateAgentflow,
    fetchVllmModelInfo,
    showSuccess,
    showError,
    showLoading,
    dismissLoading,
}) => {
    const { t } = useTranslation();
    const [agentNodes, setAgentNodes] = useState<AgentNode[]>([]);
    const [selectedAgentNode, setSelectedAgentNode] = useState<AgentNode | null>(null);
    const [userRequirements, setUserRequirements] = useState('');
    const [workflowName, setAgentflowName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [compatibleNodesCount, setCompatibleNodesCount] = useState(0);
    const [agentModelInfo, setAgentModelInfo] = useState<any>(null);
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [availableModels, setAvailableModels] = useState<Array<{ value: string; label: string }>>([]);
    const sidebarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) onClose();
        };
        if (isOpen) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const loadAgentNodes = async () => {
        if (!fetchAgentNodes) return;
        try {
            setIsLoading(true);
            const nodes = await fetchAgentNodes();
            setAgentNodes(nodes);
        } catch {
            showError?.(t('canvas.toasts.agentFetchFailed', 'Failed to fetch agent nodes'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleAgentNodeSelect = async (agentNode: AgentNode) => {
        setSelectedAgentNode(agentNode);

        const isOpenAIAgent = agentNode.id.toLowerCase().includes('openai');

        if (isOpenAIAgent) {
            const openaiModels = [
                { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
                { value: 'gpt-4', label: 'GPT-4' },
                { value: 'gpt-4o', label: 'GPT-4o' },
                { value: 'o4-mini', label: 'o4 mini' },
                { value: 'gpt-4.1', label: 'GPT-4.1' },
                { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
                { value: 'gpt-5', label: 'GPT-5' },
                { value: 'gpt-5-mini', label: 'GPT-5 Mini' },
                { value: 'gpt-5-nano', label: 'GPT-5 Nano' },
            ];
            setAvailableModels(openaiModels);
            setSelectedModel('gpt-4.1-mini');
            setAgentModelInfo(null);
        } else if (fetchVllmModelInfo) {
            try {
                const modelInfo = await fetchVllmModelInfo(agentNode.id);
                setAgentModelInfo(modelInfo);
                setCompatibleNodesCount(5);
            } catch {
                setAgentModelInfo({ model: 'default', base_url: '', temperature: 0, max_tokens: 8192 });
                setCompatibleNodesCount(5);
            }
        }

        if (!workflowName) setAgentflowName('workflow');
    };

    const handleGenerateAgentflow = async () => {
        if (!selectedAgentNode) {
            showError?.(t('canvas.toasts.agentSelectRequired', 'Select an agent node'));
            return;
        }
        if (!userRequirements.trim()) {
            showError?.(t('canvas.toasts.autoAgentflowRequirementsMissing', 'Enter requirements'));
            return;
        }
        if (!generateAgentflow) return;

        const finalAgentflowName = workflowName?.trim() || 'workflow';
        const toastId = showLoading?.(t('canvas.toasts.autoAgentflowGenerating', 'Generating workflow...'));
        setIsGenerating(true);

        try {
            let canvasContext: any = { purpose: 'auto-generated', complexity: 'auto' };
            if (getCanvasState) {
                try {
                    const currentCanvasState = getCanvasState();
                    if (currentCanvasState) {
                        const view = currentCanvasState.view || { x: 0, y: 0, scale: 1 };
                        const viewportCenterX = (window.innerWidth / 2 - view.x) / view.scale;
                        const viewportCenterY = (window.innerHeight / 2 - view.y) / view.scale;
                        canvasContext = {
                            ...canvasContext,
                            current_view: view,
                            viewport_center: { x: viewportCenterX, y: viewportCenterY },
                            existing_nodes: currentCanvasState.nodes || [],
                            existing_edges: currentCanvasState.edges || [],
                        };
                    }
                } catch { /* best-effort */ }
            }

            const requestData: any = {
                agent_node_id: selectedAgentNode.id,
                user_requirements: userRequirements,
                workflow_name: finalAgentflowName,
                context: canvasContext,
            };

            if (selectedModel && selectedAgentNode.id.toLowerCase().includes('openai')) {
                requestData.selected_model = selectedModel;
            }

            const data = await generateAgentflow(requestData);
            if (data?.success && data?.workflow_data) {
                onLoadAgentflow(data.workflow_data);
                showSuccess?.(t('canvas.toasts.autoAgentflowGenerateSuccess', 'Agentflow generated'));
                setUserRequirements('');
                setAgentflowName('');
                setSelectedAgentNode(null);
                setCompatibleNodesCount(0);
                onClose();
            } else {
                throw new Error(data?.message || 'Agentflow generation failed');
            }
        } catch (error) {
            showError?.(`${t('canvas.toasts.autoAgentflowGenerateFailed', 'Generation failed')}: ${error instanceof Error ? error.message : t('common.unknownError', 'Unknown error')}`);
        } finally {
            if (toastId) dismissLoading?.(toastId);
            setIsGenerating(false);
        }
    };

    useEffect(() => {
        if (isOpen) loadAgentNodes();
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div ref={sidebarRef} className={styles.sidebar}>
                <div className={styles.header}>
                    <h2>{t('canvas.autoAgentflow.title', '자동 에이전트플로우 생성')}</h2>
                    <button className={styles.closeButton} onClick={onClose} aria-label={t('canvas.autoAgentflow.close', 'Close')} type="button">
                        ✕
                    </button>
                </div>

                <div className={styles.content}>
                    {/* Agent node selection */}
                    <div className={styles.section}>
                        <h3>{t('canvas.autoAgentflow.selectAgent', 'Agent 노드 선택')}</h3>
                        <p className={styles.description}>
                            {t('canvas.autoAgentflow.selectAgentDescription', '에이전트플로우의 핵심이 될 Agent 노드를 선택하세요.')}
                        </p>

                        {isLoading ? (
                            <div className={styles.loading}>{t('canvas.autoAgentflow.loading', 'Loading...')}</div>
                        ) : (
                            <div className={styles.agentNodeList}>
                                {agentNodes.map((node) => (
                                    <div
                                        key={node.id}
                                        className={`${styles.agentNodeItem} ${selectedAgentNode?.id === node.id ? styles.selected : ''}`}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => handleAgentNodeSelect(node)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                handleAgentNodeSelect(node);
                                            }
                                        }}
                                    >
                                        <div className={styles.nodeHeader}>
                                            <h4>{node.nodeName}</h4>
                                            <span className={styles.nodeId}>{node.id}</span>
                                        </div>
                                        <p className={styles.nodeDescription}>{node.description}</p>
                                        <div className={styles.nodeTags}>
                                            {node.tags.slice(0, 3).map((tag) => (
                                                <span key={tag} className={styles.tag}>{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {agentNodes.length === 0 && (
                                    <div className={styles.emptyState}>
                                        {t('canvas.autoAgentflow.noAgents', '사용 가능한 Agent 노드가 없습니다.')}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Model selection (OpenAI only) */}
                    {selectedAgentNode && availableModels.length > 0 && selectedAgentNode.id.toLowerCase().includes('openai') && (
                        <div className={styles.section}>
                            <h3>{t('canvas.autoAgentflow.selectModel', '모델 선택')}</h3>
                            <Select value={selectedModel} onValueChange={setSelectedModel}>
                                <SelectTrigger className={styles.modelSelect}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableModels.map((model) => (
                                        <SelectItem key={model.value} value={model.value}>{model.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Requirements */}
                    <div className={styles.section}>
                        <h3>{t('canvas.autoAgentflow.requirements', '요구사항 입력')}</h3>
                        <textarea
                            className={styles.requirementsInput}
                            placeholder={t('canvas.autoAgentflow.requirementsPlaceholder', 'Describe the workflow you want...')}
                            value={userRequirements}
                            onChange={(e) => setUserRequirements(e.target.value)}
                            rows={4}
                        />
                    </div>

                    {/* Agentflow name */}
                    <div className={styles.section}>
                        <h3>{t('canvas.autoAgentflow.workflowName', '에이전트플로우 이름')}</h3>
                        <input
                            type="text"
                            className={styles.agentflowNameInput}
                            placeholder={t('canvas.autoAgentflow.workflowNamePlaceholder', 'Enter workflow name')}
                            value={workflowName}
                            onChange={(e) => setAgentflowName(e.target.value)}
                        />
                    </div>

                    {/* Selected agent info */}
                    {selectedAgentNode && (
                        <div className={styles.section}>
                            <h3>{t('canvas.autoAgentflow.selectedInfo', '선택된 Agent 정보')}</h3>
                            <div className={styles.selectedAgentInfo}>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>{t('canvas.autoAgentflow.nodeName', '노드명')}:</span>
                                    <span className={styles.value}>{selectedAgentNode.nodeName}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>ID:</span>
                                    <span className={styles.value}>{selectedAgentNode.id}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>{t('canvas.autoAgentflow.compatibleNodes', '호환 노드')}:</span>
                                    <span className={styles.value}>{compatibleNodesCount}{t('canvas.autoAgentflow.count', '개')}</span>
                                </div>
                                {agentModelInfo && (
                                    <>
                                        <div className={styles.infoRow}>
                                            <span className={styles.label}>{t('canvas.autoAgentflow.model', '모델')}:</span>
                                            <span className={styles.value}>{agentModelInfo.model}</span>
                                        </div>
                                        <div className={styles.infoRow}>
                                            <span className={styles.label}>API URL:</span>
                                            <span className={styles.value}>{agentModelInfo.base_url}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Generate button */}
                    <div className={styles.section}>
                        <button
                            className={styles.generateButton}
                            onClick={handleGenerateAgentflow}
                            disabled={!selectedAgentNode || !userRequirements.trim() || isGenerating}
                            type="button"
                        >
                            {isGenerating
                                ? t('canvas.autoAgentflow.generating', '생성 중...')
                                : t('canvas.autoAgentflow.generate', '에이전트플로우 생성')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Plugin Export ───────────────────────────────────────────────

export const canvasAiGeneratorPlugin: CanvasPagePlugin = {
    id: 'canvas-ai-generator',
    name: 'Canvas AI Generator',
    overlays: [
        {
            id: 'auto-agentflow-sidebar',
            component: AutoAgentflowSidebar as any,
        },
    ],
};

export { AutoAgentflowSidebar };
export default AutoAgentflowSidebar;
