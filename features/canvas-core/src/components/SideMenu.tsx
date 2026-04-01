'use client';

import React, { useState, RefObject } from 'react';
import { LuCirclePlus, LuCircleHelp, LuSettings, LuLayoutGrid, LuLayoutTemplate } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import styles from '../styles/side-menu.module.scss';

// ── Types ──────────────────────────────────────────────────────

export type MenuView = 'main' | 'addNodes' | 'chat' | 'workflow' | 'template';

interface MainMenuProps {
    onNavigate: (view: MenuView) => void;
}

export interface SideMenuProps {
    menuRef: RefObject<HTMLElement | null>;
    /** Rendered when view === 'addNodes' */
    AddNodePanel?: React.ComponentType<{ onBack: () => void }>;
    /** Rendered when view === 'workflow' */
    WorkflowPanel?: React.ComponentType<{ onBack: () => void }>;
    /** Rendered when view === 'template' */
    TemplatePanel?: React.ComponentType<{ onBack: () => void }>;
    /** Initial view to display when opened (e.g. 'template' from empty state) */
    initialView?: MenuView | null;
}

// ── Main Menu ──────────────────────────────────────────────────

const MainMenu: React.FC<MainMenuProps> = ({ onNavigate }) => {
    const { t } = useTranslation();
    return (
        <div className={styles.menuList}>
            <button className={styles.menuItem} onClick={() => onNavigate('addNodes')} type="button">
                <LuCirclePlus />
                <span>{t('canvas.sideMenu.addNode', '노드 추가')}</span>
            </button>
            <button className={styles.menuItem} onClick={() => onNavigate('workflow')} type="button">
                <LuLayoutGrid />
                <span>{t('canvas.sideMenu.workflow', '워크플로우')}</span>
            </button>
            <button className={styles.menuItem} onClick={() => onNavigate('template')} type="button">
                <LuLayoutTemplate />
                <span>{t('canvas.sideMenu.template', '템플릿')}</span>
            </button>
            <button className={styles.menuItem} type="button">
                <LuSettings />
                <span>{t('canvas.sideMenu.settings', '설정')}</span>
            </button>
            <button className={styles.menuItem} type="button">
                <LuCircleHelp />
                <span>{t('canvas.sideMenu.help', '도움말')}</span>
            </button>
        </div>
    );
};

// ── Side Menu ──────────────────────────────────────────────────

const SideMenu: React.FC<SideMenuProps> = ({
    menuRef,
    AddNodePanel,
    WorkflowPanel,
    TemplatePanel,
    initialView = null,
}) => {
    const [view, setView] = useState<MenuView>('main');

    React.useEffect(() => {
        if (initialView && (initialView === 'template' || initialView === 'addNodes')) {
            setView(initialView);
        }
    }, [initialView]);

    const handleNavigate = (newView: MenuView): void => setView(newView);
    const handleBackToMain = (): void => setView('main');

    return (
        <aside ref={menuRef} className={styles.sideMenuContainer} data-view={view}>
            {view === 'main' && <MainMenu onNavigate={handleNavigate} />}
            {view === 'addNodes' && AddNodePanel && <AddNodePanel onBack={handleBackToMain} />}
            {view === 'workflow' && WorkflowPanel && <WorkflowPanel onBack={handleBackToMain} />}
            {view === 'template' && TemplatePanel && <TemplatePanel onBack={handleBackToMain} />}
        </aside>
    );
};

export default SideMenu;
