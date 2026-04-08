'use client';
import React from 'react';
import styles from '../styles/TutorialOverlay.module.scss';
import { useTranslation } from '@xgen/i18n';
import type { TutorialData } from '../types';

interface TutorialOverlayProps {
    tutorialData: TutorialData;
    currentStep: number;
    onNext: () => void;
    onExit: () => void;
    isAnimating: boolean;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
    tutorialData,
    currentStep,
    onNext,
    onExit,
    isAnimating,
}) => {
    const { t } = useTranslation();
    const totalSteps = tutorialData.tutorial_steps.length;
    const step = tutorialData.tutorial_steps[currentStep];
    const isLastStep = currentStep >= totalSteps - 1;
    const progressPercent = ((currentStep + 1) / totalSteps) * 100;

    if (!step) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.header}>
                <span className={styles.stepBadge}>
                    {t('canvas.tutorial.stepOf', { current: currentStep + 1, total: totalSteps })}
                </span>
                <h4 className={styles.title}>{step.title}</h4>
            </div>

            <div className={styles.progressBar}>
                <div
                    className={styles.progressFill}
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            <div className={styles.body}>
                <p className={styles.message}>{step.message}</p>
            </div>

            <div className={styles.footer}>
                <button
                    className={styles.exitButton}
                    onClick={onExit}
                    disabled={isAnimating}
                >
                    {t('canvas.tutorial.exit', '종료')}
                </button>
                <button
                    className={styles.nextButton}
                    onClick={onNext}
                    disabled={isAnimating}
                >
                    {isAnimating
                        ? '...'
                        : isLastStep
                            ? t('canvas.tutorial.complete', '완료')
                            : t('canvas.tutorial.next', '확인')
                    }
                </button>
            </div>
        </div>
    );
};

export default TutorialOverlay;
