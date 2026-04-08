'use client';
import React, { useState, useEffect } from 'react';
import styles from '../styles/TutorialPanel.module.scss';
import { LuArrowLeft, LuBookOpen, LuLayoutTemplate, LuLoader } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { createApiClient } from '@xgen/api-client';
import { TUTORIALS } from '../scenarios';
import { workflowToTutorial } from '../workflowToTutorial';
import type { TutorialData } from '../types';

interface TemplateWorkflow {
    id: number;
    workflow_id: string;
    workflow_name: string;
    workflow_upload_name: string;
    description: string;
    tags?: string[] | null;
    node_count: number;
    edge_count: number;
    is_template: boolean;
    workflow_data?: any;
}

interface TutorialPanelProps {
    onBack: () => void;
    onSelectTutorial: (tutorial: TutorialData) => void;
}

const TutorialPanel: React.FC<TutorialPanelProps> = ({
    onBack,
    onSelectTutorial,
}) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'basic' | 'template'>('basic');
    const [templateTutorials, setTemplateTutorials] = useState<TutorialData[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (activeTab !== 'template') return;
        if (templateTutorials.length > 0) return;

        const loadTemplateTutorials = async () => {
            try {
                setIsLoading(true);
                const api = createApiClient();
                const res = await api.get<{ workflows: TemplateWorkflow[] }>('/api/workflow/store/list');
                const workflowList = res.data?.workflows || [];
                const templates = workflowList.filter((w) => w.is_template === true);

                const converted: TutorialData[] = templates
                    .filter((tmpl) => tmpl.workflow_data)
                    .map((template) => {
                        let workflowData = template.workflow_data;
                        if (typeof workflowData === 'string') {
                            try {
                                workflowData = JSON.parse(workflowData);
                            } catch {
                                return null;
                            }
                        }
                        return workflowToTutorial(
                            workflowData,
                            template.workflow_id,
                            template.description,
                            template.tags?.filter(Boolean) as string[] | undefined,
                        );
                    })
                    .filter(Boolean) as TutorialData[];

                setTemplateTutorials(converted);
            } catch (error) {
                console.error('Failed to load template tutorials:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadTemplateTutorials();
    }, [activeTab, templateTutorials.length]);

    const currentList = activeTab === 'basic' ? TUTORIALS : templateTutorials;

    return (
        <div className={styles.tutorialPanel}>
            <div className={styles.header}>
                <button onClick={onBack} className={styles.backButton}>
                    <LuArrowLeft />
                </button>
                <h3>{t('canvas.tutorial.panelTitle', '튜토리얼 선택')}</h3>
            </div>

            {/* Tabs */}
            <div className={styles.tabContainer}>
                <button
                    className={`${styles.tab} ${activeTab === 'basic' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('basic')}
                >
                    <LuBookOpen />
                    <span>{t('canvas.tutorial.tabBasic', '기본 튜토리얼')}</span>
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'template' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('template')}
                >
                    <LuLayoutTemplate />
                    <span>{t('canvas.tutorial.tabTemplate', '템플릿 튜토리얼')}</span>
                </button>
            </div>

            <div className={styles.listHeader}>
                <h3>
                    {activeTab === 'basic'
                        ? t('canvas.tutorial.panelDescription', '단계별로 에이전트플로우를 배워보세요')
                        : t('canvas.tutorial.templateDescription', '템플릿을 기반으로 에이전트플로우를 배워보세요')}
                </h3>
                <span className={styles.count}>
                    {activeTab === 'template' && isLoading ? '...' : currentList.length}
                </span>
            </div>

            <div className={styles.tutorialList}>
                {/* Loading */}
                {activeTab === 'template' && isLoading && (
                    <div className={styles.loadingState}>
                        <LuLoader className={styles.spinIcon} />
                        <span>{t('canvas.tutorial.loading', '템플릿을 불러오는 중...')}</span>
                    </div>
                )}

                {/* Empty */}
                {!isLoading && currentList.length === 0 && (
                    <div className={styles.emptyState}>
                        {t('canvas.tutorial.noTutorials', '등록된 튜토리얼이 없습니다.')}
                    </div>
                )}

                {/* Tutorial list */}
                {!isLoading &&
                    currentList.map((tutorial) => (
                        <div key={tutorial.tutorial_id} className={styles.tutorialItem}>
                            <div className={styles.tutorialItemHeader}>
                                <div className={styles.tutorialIcon}>
                                    {activeTab === 'basic' ? <LuBookOpen /> : <LuLayoutTemplate />}
                                </div>
                                <div className={styles.tutorialInfo}>
                                    <h4 className={styles.tutorialName}>
                                        {tutorial.tutorial_name}
                                    </h4>
                                    <p className={styles.tutorialDescription}>
                                        {tutorial.tutorial_description && tutorial.tutorial_description.length > 40
                                            ? `${tutorial.tutorial_description.substring(0, 40)}...`
                                            : tutorial.tutorial_description}
                                    </p>
                                    <div className={styles.tutorialMeta}>
                                        <div className={styles.tutorialTags}>
                                            {tutorial.tags.slice(0, 2).map((tag) => (
                                                <span key={tag} className={styles.tutorialTag}>
                                                    {tag}
                                                </span>
                                            ))}
                                            {tutorial.tags.length > 2 && (
                                                <span className={styles.tutorialTag}>
                                                    +{tutorial.tags.length - 2}
                                                </span>
                                            )}
                                        </div>
                                        <span className={styles.tutorialSteps}>
                                            {tutorial.tutorial_steps.length} {t('canvas.tutorial.steps', '단계')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.tutorialActions}>
                                <button
                                    className={styles.tutorialActionButton}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelectTutorial(tutorial);
                                    }}
                                    title="Start Tutorial"
                                >
                                    <LuBookOpen />
                                </button>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default TutorialPanel;
