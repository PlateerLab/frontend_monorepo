import React, { useState, ReactNode } from 'react';
import styles from '../styles/node-list.module.scss';

interface NodeListProps {
    title: string;
    children: ReactNode;
}

const NodeList: React.FC<NodeListProps> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);

    return (
        <div className={styles.accordion}>
            <button className={styles.header} onClick={() => setIsOpen(!isOpen)} type="button">
                <span>{title}</span>
                <span
                    className={styles.icon}
                    style={{
                        maskImage: 'url(/icons/data/Icon_Data_Down.svg)',
                        WebkitMaskImage: 'url(/icons/data/Icon_Data_Down.svg)',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                    }}
                    aria-hidden
                />
            </button>
            {isOpen && <div className={styles.content}>{children}</div>}
        </div>
    );
};

export default NodeList;
