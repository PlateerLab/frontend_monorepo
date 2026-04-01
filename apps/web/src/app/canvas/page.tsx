'use client';

import React, { Suspense, useEffect, useState, useCallback, useMemo, lazy } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@xgen/ui';
import type { SidebarConfig } from '@xgen/ui';
import type { SidebarSection as SidebarSectionType } from '@xgen/types';
import { useTranslation } from '@xgen/i18n';
import { AuthGuard, useAuth } from '@xgen/auth-provider';
import { featureRegistry, initializeFeatures } from '@/features';
import type { SidebarSection as FeatureSidebarSection } from '@/features';
import styles from './CanvasPage.module.scss';

// ─────────────────────────────────────────────────────────────
// Lazy imports — avoid module evaluation crash at load time
// ─────────────────────────────────────────────────────────────

const CanvasPageLazy = lazy(() =>
    import('@/components/CanvasPage').then((mod) => ({ default: mod.CanvasPage }))
);

// ─────────────────────────────────────────────────────────────
// Loading Component
// ─────────────────────────────────────────────────────────────

const LoadingSpinner: React.FC = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{
            width: 40,
            height: 40,
            border: '3px solid #e5e7eb',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
);

// ─────────────────────────────────────────────────────────────
// Transform feature sidebar sections to @xgen/ui format
// ─────────────────────────────────────────────────────────────

function transformToSidebarSections(
    featureSections: FeatureSidebarSection[]
): SidebarSectionType[] {
    return featureSections.map((section) => ({
        id: section.id,
        titleKey: section.titleKey,
        items: section.items.map((item) => ({
            id: item.id,
            titleKey: item.titleKey,
            descriptionKey: item.descriptionKey,
            icon: item.iconComponent,
        })),
    }));
}

// ─────────────────────────────────────────────────────────────
// Canvas Page Content Component
// ─────────────────────────────────────────────────────────────

function CanvasPageContent() {
    const router = useRouter();
    const { t } = useTranslation();
    const { user, logout } = useAuth();

    const [pluginsReady, setPluginsReady] = useState(false);
    const [sections, setSections] = useState<FeatureSidebarSection[]>([]);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Initialize features + canvas plugins
    useEffect(() => {
        async function init() {
            await initializeFeatures();
            const sidebarSections = featureRegistry.getSidebarSections();
            setSections(sidebarSections);

            const { registerCanvasPlugins } = await import('@/features/canvas-features');
            registerCanvasPlugins();
            setPluginsReady(true);
        }
        init();
    }, []);

    // Navigation handler — canvas stays, everything else → /main
    const handleNavigate = useCallback((itemId: string, href?: string) => {
        if (href) {
            router.push(href);
            return;
        }
        if (itemId === 'canvas') return; // already on canvas
        router.push(`/main?section=${itemId}`);
    }, [router]);

    const handleSidebarToggle = useCallback(() => {
        setSidebarCollapsed(prev => !prev);
    }, []);

    const sidebarSections = useMemo(
        () => transformToSidebarSections(sections),
        [sections]
    );

    const sidebarConfig: SidebarConfig = useMemo(() => ({
        logo: {
            expanded: 'XGEN',
            collapsed: 'X',
        },
        header: {
            modeLabelKey: 'sidebar.userMode',
            showAdminButton: false,
        },
        sections: sidebarSections,
        support: {
            titleKey: 'sidebar.support.title',
            items: [
                { id: 'service-request', titleKey: 'sidebar.support.request.title', href: '/support?view=inquiry' },
                { id: 'faq', titleKey: 'sidebar.support.faq.title' },
            ],
        },
        user: {
            name: user?.username || 'User',
            role: user?.is_admin ? 'Admin' : 'Member',
        },
        onNavigate: handleNavigate,
        onLogoClick: () => handleNavigate('main-dashboard'),
        onLogout: () => {
            logout();
        },
        collapsed: sidebarCollapsed,
        onToggle: handleSidebarToggle,
        activeItemId: 'canvas',
        variant: 'main',
    }), [sidebarSections, handleNavigate, sidebarCollapsed, handleSidebarToggle, user, logout]);

    if (!pluginsReady) {
        return <LoadingSpinner />;
    }

    return (
        <div className={styles.container}>
            <Sidebar config={sidebarConfig} />

            <main className={`${styles.content} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
                <Suspense fallback={<LoadingSpinner />}>
                    <CanvasPageLazy onNavigate={handleNavigate} sidebarCollapsed={sidebarCollapsed} />
                </Suspense>
            </main>
        </div>
    );
}

export default function CanvasRoute() {
    return (
        <AuthGuard>
            <Suspense fallback={<LoadingSpinner />}>
                <CanvasPageContent />
            </Suspense>
        </AuthGuard>
    );
}
