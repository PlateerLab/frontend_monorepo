'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MainSidebar } from '@xgen/sidebar-main';
import type { MainSidebarSection } from '@xgen/sidebar-main';
import { useTranslation } from '@xgen/i18n';
import { AuthGuard, useAuth } from '@xgen/auth-provider';
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
// Main Page Content Component (uses useSearchParams)
// ─────────────────────────────────────────────────────────────

function MainPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { user, logout } = useAuth();

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

  // Transform sections for MainSidebar
  const mainSidebarSections: MainSidebarSection[] = useMemo(
    () => sections.map((section) => ({
      id: section.id,
      titleKey: section.titleKey,
      items: section.items.map((item) => ({
        id: item.id,
        titleKey: item.titleKey,
        descriptionKey: item.descriptionKey,
        iconComponent: item.iconComponent,
      })),
    })),
    [sections]
  );

  if (!initialized) {
    return <LoadingSpinner />;
  }

  return (
    <div className={styles.container}>
      <MainSidebar
        sections={mainSidebarSections}
        activeItemId={activeItemId}
        collapsed={sidebarCollapsed}
        userName={user?.username}
        isAdmin={user?.is_admin}
        onNavigate={handleNavigate}
        onToggle={handleSidebarToggle}
        onLogout={() => logout()}
        onAdminClick={user?.is_admin ? () => router.push('/admin') : undefined}
      />

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
    <AuthGuard>
      <Suspense fallback={<LoadingSpinner />}>
        <MainPageContent />
      </Suspense>
    </AuthGuard>
  );
}
