import React, { useState } from 'react';
import styles from '../../../styles/Node.module.scss';
import type { NodeHeaderProps } from '../types';
import { useTranslation } from '@xgen/i18n';
import { getLocalizedNodeName } from '../utils/nodeUtils';
import { getLocalizedPortDescription } from '../utils/parameterUtils';
import { FiInfo, FiChevronUp, FiChevronDown } from '@xgen/icons';

export const NodeHeader: React.FC<NodeHeaderProps> = ({
    nodeName,
    nodeNameKo,
    nodeDataId,
    description,
    description_ko,
    functionId,
    isEditingName,
    editingName,
    isPreview = false,
    isExpanded = true,
    onNameDoubleClick,
    onNameChange,
    onNameKeyDown,
    onNameBlur,
    onClearSelection,
    onToggleExpanded
}) => {
    const [showDescTooltip, setShowDescTooltip] = useState(false);

    const handleInputMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const handleInputClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const handleInputFocus = (e: React.FocusEvent) => {
        e.stopPropagation();
        if (onClearSelection) {
            onClearSelection();
        }
    };

    const handleInputDragStart = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleToggleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onToggleExpanded && !isPreview) {
            onToggleExpanded(e);
        }
    };

    const { locale } = useTranslation();
    const localizedName = getLocalizedNodeName(nodeName, nodeNameKo, locale);
    const displayName = localizedName.length > 25 ? localizedName.substring(0, 25) + '...' : localizedName;

    const localizedDesc = getLocalizedPortDescription({ description, description_ko }, locale);

    return (
        <div className={styles.header}>
            <div className={styles.headerContent}>
                {isEditingName ? (
                    <input
                        type="text"
                        value={editingName}
                        onChange={onNameChange}
                        onKeyDown={onNameKeyDown}
                        onBlur={onNameBlur}
                        onMouseDown={handleInputMouseDown}
                        onClick={handleInputClick}
                        onFocus={handleInputFocus}
                        onDragStart={handleInputDragStart}
                        draggable={false}
                        className={styles.nameInput}
                        autoFocus
                    />
                ) : (
                    <span onDoubleClick={onNameDoubleClick} className={styles.nodeName}>
                        {displayName}
                    </span>
                )}
                {functionId && <span className={styles.functionId}>{functionId}</span>}
            </div>
            <div className={styles.headerActions}>
                {localizedDesc && (
                    <div
                        className={styles.nodeDescButton}
                        onMouseEnter={() => setShowDescTooltip(true)}
                        onMouseLeave={() => setShowDescTooltip(false)}
                    >
                        <FiInfo size={24} />
                        {showDescTooltip && (
                            <div className={styles.nodeDescTooltip}>
                                {localizedDesc}
                            </div>
                        )}
                    </div>
                )}
                {!isPreview && onToggleExpanded && (
                    <button
                        className={styles.toggleButton}
                        onClick={handleToggleClick}
                        title={isExpanded ? "축소" : "확대"}
                    >
                        {isExpanded ? <FiChevronUp size={20} aria-hidden /> : <FiChevronDown size={20} aria-hidden />}
                    </button>
                )}
            </div>
        </div>
    );
};
