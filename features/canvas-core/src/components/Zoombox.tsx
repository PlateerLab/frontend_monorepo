'use client';

import React from 'react';
import styles from '../styles/zoombox.module.scss';

export interface ZoomboxProps {
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    disabled?: boolean;
    /** If true, renders inline (no position: absolute) — useful for previews */
    inline?: boolean;
    className?: string;
    /** Optional zoom-in icon component */
    ZoomInIcon?: React.ComponentType<{ className?: string }>;
    /** Optional zoom-out icon component */
    ZoomOutIcon?: React.ComponentType<{ className?: string }>;
}

const Zoombox: React.FC<ZoomboxProps> = ({
    onZoomIn,
    onZoomOut,
    disabled = false,
    inline = false,
    className = '',
    ZoomInIcon,
    ZoomOutIcon,
}) => {
    return (
        <div
            className={`${styles.wrapper} ${inline ? styles.inline : ''} ${disabled ? styles.disabled : ''} ${className}`.trim()}
            role="group"
            aria-label="Canvas zoom controls"
        >
            <button
                type="button"
                className={styles.zoomButton}
                onClick={onZoomIn}
                disabled={disabled}
                aria-label="Zoom in"
                title="Zoom in"
            >
                {ZoomInIcon ? <ZoomInIcon className={styles.icon} /> : <span>+</span>}
            </button>
            <button
                type="button"
                className={styles.zoomButton}
                onClick={onZoomOut}
                disabled={disabled}
                aria-label="Zoom out"
                title="Zoom out"
            >
                {ZoomOutIcon ? <ZoomOutIcon className={styles.icon} /> : <span>−</span>}
            </button>
        </div>
    );
};

export default Zoombox;
