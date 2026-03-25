'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sidebar } from '@xgen/ui';
import type { SidebarConfig, SidebarSection as SidebarSectionType, SidebarMenuItem } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { featureRegistry, initializeFeatures } from '@/features';
import { getRoutePath, DEFAULT_ROUTE } from '@/features/routeConfig';
import type { SidebarSection as FeatureSidebarSection } from '@/features';
import styles from './MainPage.module.scss';

// ─────────────────────────────────────────────────────────────
// Loading Component
// ─────────────────────────────────────────────────────────────

const LoadingSpinner: React.FC = () => (
  <div className={styles.loading}>
    <div className={styles.spinner} />
    <p>Loading...</p>
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
// Main Page Content Component (uses useSearchParams)
// ─────────────────────────────────────────────────────────────

function MainPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const [initialized, setInitialized] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string>(DEFAULT_ROUTE);
  const [sections, setSections] = useState<FeatureSidebarSection[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [CurrentComponent, setCurrentComponent] = useState<React.ComponentType<any> | null>(null);

  // Initialize features on mount
  useEffect(() => {
    async function init() {
      await initializeFeatures();
      const sidebarSections = featureRegistry.getSidebarSections();
      setSections(sidebarSections);
      setInitialized(true);
    }
    init();
  }, []);

  // Handle route from URL
  useEffect(() => {
    if (!initialized) return;

    const section = searchParams.get('section');
    if (section) {
      setActiveItemId(section);
      const component = featureRegistry.getRouteComponent(getRoutePath(section));
      setCurrentComponent(() => component || null);
    } else {
      setActiveItemId(DEFAULT_ROUTE);
      const component = featureRegistry.getRouteComponent(DEFAULT_ROUTE);
      setCurrentComponent(() => component || null);
    }
  }, [initialized, searchParams]);

  // Navigation handler
  const handleNavigate = useCallback((itemId: string, href?: string) => {
    if (href) {
      router.push(href);
      return;
    }
    setActiveItemId(itemId);
    const routePath = getRoutePath(itemId);
    const component = featureRegistry.getRouteComponent(routePath);
    setCurrentComponent(() => component || null);

    // Update URL without full page reload
    router.push(`/main?section=${itemId}`, { scroll: false });
  }, [router]);

  // Sidebar toggle handler
  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  // Transform sections for @xgen/ui Sidebar
  const sidebarSections = useMemo(
    () => transformToSidebarSections(sections),
    [sections]
  );

  // Build sidebar config
  const sidebarConfig: SidebarConfig = useMemo(() => ({
    logo: {
      expanded: 'XGEN',
      collapsed: 'X',
    },
    header: {
      modeLabelKey: 'sidebar.userMode',
      showAdminButton: false, // TODO: Check admin permissions
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
      name: 'User', // TODO: Get from auth context
      role: 'Member',
    },
    onNavigate: handleNavigate,
    onLogoClick: () => handleNavigate('main-dashboard'),
    onLogout: () => {
      // TODO: Implement logout with @xgen/auth-provider
      router.push('/');
    },
    collapsed: sidebarCollapsed,
    onToggle: handleSidebarToggle,
    activeItemId,
    variant: 'main',
  }), [sidebarSections, handleNavigate, sidebarCollapsed, handleSidebarToggle, activeItemId, router]);

  if (!initialized) {
    return <LoadingSpinner />;
  }

  return (
    <div className={styles.container}>
      <Sidebar config={sidebarConfig} />

      <main className={`${styles.content} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <Suspense fallback={<LoadingSpinner />}>
          {CurrentComponent ? (
            <CurrentComponent onNavigate={handleNavigate} />
          ) : (
            <div className={styles.notFound}>
              <h2>Page not found</h2>
              <p>The requested page could not be found.</p>
            </div>
          )}
        </Suspense>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page with Suspense boundary for useSearchParams
// ─────────────────────────────────────────────────────────────

export default function MainPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <MainPageContent />
    </Suspense>
  );
}
