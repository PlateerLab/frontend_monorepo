'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdminSidebar } from '@xgen/sidebar-admin';
import { useTranslation } from '@xgen/i18n';
import { AuthGuard, useAuth } from '@xgen/auth-provider';
import { ContentArea } from '@xgen/ui';
import { initializeAdminFeatures, getAdminRouteComponent } from '@/features/adminFeatureRegistry';
import styles from './AdminPage.module.scss';

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
// Admin Dashboard (default landing)
// ─────────────────────────────────────────────────────────────

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-xl font-bold text-foreground">{t('admin.dashboard.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.dashboard.description')}</p>
      </div>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Admin Page Content Component (uses useSearchParams)
// ─────────────────────────────────────────────────────────────

const DEFAULT_ADMIN_VIEW = 'dashboard';

function AdminPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale, setLocale } = useTranslation();
  const { user, logout } = useAuth();

  const [initialized, setInitialized] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string>(DEFAULT_ADMIN_VIEW);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [CurrentComponent, setCurrentComponent] = useState<React.ComponentType<any> | null>(null);

  // Initialize admin features on mount
  useEffect(() => {
    async function init() {
      await initializeAdminFeatures();
      setInitialized(true);
    }
    init();
  }, []);

  // Handle route from URL
  useEffect(() => {
    if (!initialized) return;

    const view = searchParams.get('view');
    if (view && view !== 'dashboard') {
      setActiveItemId(view);
      const component = getAdminRouteComponent(view);
      setCurrentComponent(() => component || null);
    } else {
      setActiveItemId(DEFAULT_ADMIN_VIEW);
      setCurrentComponent(null); // will render AdminDashboard
    }
  }, [initialized, searchParams]);

  // Navigation handler — sidebar item click
  const handleItemClick = useCallback((itemId: string) => {
    setActiveItemId(itemId);

    if (itemId === 'dashboard') {
      setCurrentComponent(null);
      router.push('/admin', { scroll: false });
      return;
    }

    const component = getAdminRouteComponent(itemId);
    setCurrentComponent(() => component || null);
    router.push(`/admin?view=${itemId}`, { scroll: false });
  }, [router]);

  // Back to user mode
  const handleBackToChat = useCallback(() => {
    router.push('/main');
  }, [router]);

  // Sidebar toggle
  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  if (!initialized) {
    return <LoadingSpinner />;
  }

  return (
    <div className={styles.container}>
      <AdminSidebar
        isOpen={sidebarOpen}
        onToggle={handleSidebarToggle}
        activeItem={activeItemId}
        onItemClick={handleItemClick}
        userName={user?.username}
        locale={locale}
        onLocaleChange={(l) => setLocale(l as 'ko' | 'en')}
        onLogout={() => logout()}
        onBackToChat={handleBackToChat}
        onUserClick={() => router.push('/mypage')}
      />

      <main className={`${styles.content} ${!sidebarOpen ? styles.sidebarCollapsed : ''}`}>
        <Suspense fallback={<LoadingSpinner />}>
          {CurrentComponent ? (
            <CurrentComponent onNavigate={handleItemClick} />
          ) : (
            <AdminDashboard />
          )}
        </Suspense>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Admin Page with Suspense boundary for useSearchParams
// ─────────────────────────────────────────────────────────────

export default function AdminPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<LoadingSpinner />}>
        <AdminPageContent />
      </Suspense>
    </AuthGuard>
  );
}
