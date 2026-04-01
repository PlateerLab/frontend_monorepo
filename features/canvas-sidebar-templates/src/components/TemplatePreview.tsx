import React, { useRef, useEffect, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { LuX, LuCopy } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import MiniCanvas, { type Template } from './MiniCanvas';
import styles from '../styles/template-preview.module.scss';

interface TemplatePreviewProps {
    template: Template | null;
    onClose: () => void;
    onUseTemplate: (template: Template | null) => void;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ template, onClose, onUseTemplate }) => {
    const { t } = useTranslation();
    const previewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscapeKey = (event: KeyboardEvent): void => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscapeKey);
        return () => document.removeEventListener('keydown', handleEscapeKey);
    }, [onClose]);

    const handleUseTemplate = (tmpl: Template | null): void => {
        onUseTemplate(tmpl);
        onClose();
    };

    if (!template) return null;

    const modalContent = (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div
                className={styles.previewContainer}
                ref={previewRef}
                data-template-preview="true"
                onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
                onMouseDown={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
            >
                <div className={styles.header}>
                    <div className={styles.titleSection}>
                        <h3>{template.name}</h3>
                        <div className={styles.tagsContainer}>
                            {template.tags?.map((tag) => (
                                <span key={tag} className={styles.category}>{tag}</span>
                            ))}
                        </div>
                    </div>
                    <div className={styles.actions}>
                        <button
                            className={styles.useButton}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleUseTemplate(template); }}
                            onMouseDown={(e) => e.stopPropagation()}
                            title={t('canvas.templatePreview.useTemplate', 'Use Template')}
                            type="button"
                        >
                            <LuCopy />
                            {t('canvas.templatePreview.useTemplate', 'Use Template')}
                        </button>
                        <button
                            className={styles.closeButton}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
                            onMouseDown={(e) => e.stopPropagation()}
                            title={t('canvas.templatePreview.closePreview', 'Close Preview')}
                            type="button"
                        >
                            <LuX />
                        </button>
                    </div>
                </div>

                <div className={styles.previewContent}>
                    <div className={styles.canvasContainer}>
                        <MiniCanvas template={template} />
                    </div>
                    <div className={styles.templateInfo}>
                        <p className={styles.description}>{template.description}</p>
                        <div className={styles.stats}>
                            <div className={styles.stat}>
                                <span className={styles.statLabel}>Nodes:</span>
                                <span className={styles.statValue}>{template.nodes}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

export default TemplatePreview;
