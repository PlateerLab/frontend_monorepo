'use client';

import React, { useState, RefObject } from 'react';
import { LuCirclePlus, LuCircleHelp, LuSettings, LuLayoutGrid, LuLayoutTemplate } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { cn } from '@xgen/ui';
import '../styles/side-menu-keyframes.css';

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
    AgentflowPanel?: React.ComponentType<{ onBack: () => void }>;
    /** Rendered when view === 'template' */
    TemplatePanel?: React.ComponentType<{ onBack: () => void }>;
    /** Initial view to display when opened (e.g. 'template' from empty state) */
    initialView?: MenuView | null;
    /** Called to close the entire side menu */
    onClose?: () => void;
}

// ── Main Menu ──────────────────────────────────────────────────

const MainMenu: React.FC<MainMenuProps> = ({ onNavigate }) => {
    const { t } = useTranslation();
    return (
        <div className="py-3 px-2 flex flex-col gap-1">
            <button className="flex items-center gap-2 w-full py-2 px-6 text-sm font-normal leading-5 text-left bg-transparent border-none cursor-pointer text-[#7a7f89] select-none hover:bg-[#f0f3fd] hover:text-[#305eeb]" onClick={() => onNavigate('addNodes')} type="button">
                <LuCirclePlus />
                <span>{t('canvas.sideMenu.addNode', '노드 추가')}</span>
            </button>
            <button className="flex items-center gap-2 w-full py-2 px-6 text-sm font-normal leading-5 text-left bg-transparent border-none cursor-pointer text-[#7a7f89] select-none hover:bg-[#f0f3fd] hover:text-[#305eeb]" onClick={() => onNavigate('workflow')} type="button">
                <LuLayoutGrid />
                <span>{t('canvas.sideMenu.agentflow', '에이전트플로우')}</span>
            </button>
            <button className="flex items-center gap-2 w-full py-2 px-6 text-sm font-normal leading-5 text-left bg-transparent border-none cursor-pointer text-[#7a7f89] select-none hover:bg-[#f0f3fd] hover:text-[#305eeb]" onClick={() => onNavigate('template')} type="button">
                <LuLayoutTemplate />
                <span>{t('canvas.sideMenu.template', '템플릿')}</span>
            </button>
            <button className="flex items-center gap-2 w-full py-2 px-6 text-sm font-normal leading-5 text-left bg-transparent border-none cursor-pointer text-[#7a7f89] select-none hover:bg-[#f0f3fd] hover:text-[#305eeb]" type="button">
                <LuSettings />
                <span>{t('canvas.sideMenu.settings', '설정')}</span>
            </button>
            <button className="flex items-center gap-2 w-full py-2 px-6 text-sm font-normal leading-5 text-left bg-transparent border-none cursor-pointer text-[#7a7f89] select-none hover:bg-[#f0f3fd] hover:text-[#305eeb]" type="button">
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
    AgentflowPanel,
    TemplatePanel,
    initialView = null,
    onClose,
}) => {
    const [view, setView] = useState<MenuView>('main');

    React.useEffect(() => {
        if (initialView && (initialView === 'template' || initialView === 'addNodes' || initialView === 'workflow')) {
            setView(initialView);
        }
    }, [initialView]);

    const handleNavigate = (newView: MenuView): void => setView(newView);
    const handleBackToMain = (): void => {
        if (initialView && onClose) {
            onClose();
        } else {
            setView('main');
        }
    };

    return (
        <aside
            ref={menuRef}
            className={cn(
                'absolute top-2.5 right-2.5 min-w-[320px] w-auto max-w-[600px] h-auto rounded-[14px] border border-black/5 z-[1000] overflow-hidden select-none flex flex-col bg-gradient-to-br from-white to-slate-50 origin-top-right shadow-[0_12px_40px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.06)] animate-[pop-in_0.25s_cubic-bezier(0.175,0.885,0.32,1.275)_forwards] transition-[width,height] duration-300 ease-in-out',
                view === 'addNodes' && 'min-w-[400px] w-[400px] max-w-[400px] h-[796px] max-h-[85vh] bg-white bg-none rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.16)] border-[#abb1ba]',
                (view === 'workflow' || view === 'template') && 'min-w-[400px] w-auto max-w-[600px] h-[85vh] max-h-[700px]',
            )}
            data-view={view}
        >
            {view === 'main' && <MainMenu onNavigate={handleNavigate} />}
            {view === 'addNodes' && AddNodePanel && <AddNodePanel onBack={handleBackToMain} />}
            {view === 'workflow' && AgentflowPanel && <AgentflowPanel onBack={handleBackToMain} />}
            {view === 'template' && TemplatePanel && <TemplatePanel onBack={handleBackToMain} />}
        </aside>
    );
};

export default SideMenu;
