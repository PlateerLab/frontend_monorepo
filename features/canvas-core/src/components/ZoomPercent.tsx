'use client';

import React from 'react';
import styles from '../styles/zoom-percent.module.scss';

export interface ZoomPercentProps {
    /** Zoom percentage value (e.g. 100 → "100%") */
    value?: number;
    disabled?: boolean;
    className?: string;
}

const ZoomPercent: React.FC<ZoomPercentProps> = ({
    value = 100,
    disabled = false,
    className = '',
}) => {
    return (
        <div
            className={`${styles.wrapper} ${disabled ? styles.disabled : ''} ${className}`.trim()}
            role="status"
            aria-label={`Zoom ${Math.round(value)}%`}
        >
            <span className={styles.percentText}>{Math.round(value)}%</span>
        </div>
    );
};

export default ZoomPercent;
