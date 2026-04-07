'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MypageSidebar } from '@xgen/sidebar-mypage';
import { mypageSidebarConfig } from '@xgen/sidebar-mypage';
import { useTranslation } from '@xgen/i18n';
import { AuthGuard, useAuth } from '@xgen/auth-provider';
import { ContentArea } from '@xgen/ui';
import styles from './MypagePage.module.scss';

// Register mypage i18n translations
import '@xgen/mypage-profile/src/locales';

// Lazy-loaded content components
import { ProfileView } from '@xgen/mypage-profile/src/components/ProfileView';
import { ProfileEdit } from '@xgen/mypage-profile/src/components/ProfileEdit';

// ─────────────────────────────────────────────────────────────
// Valid section IDs
// ─────────────────────────────────────────────────────────────

const ALL_SECTION_IDS = mypageSidebarConfig.flatMap((s) => s.items.map((i) => i.id));
const DEFAULT_SECTION = 'profile';

function isValidSection(id: string | null): id is string {
  return id !== null && ALL_SECTION_IDS.includes(id);
}

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
// Placeholder for unimplemented sections
// ─────────────────────────────────────────────────────────────

const PlaceholderSection: React.FC = () => {
  const { t } = useTranslation();
  return (
    <ContentArea>
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2 text-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
            <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
          <h3 className="text-sm font-semibold text-foreground">{t('mypage.placeholder.title')}</h3>
          <p className="text-xs text-muted-foreground">{t('mypage.placeholder.description')}</p>
        </div>
      </div>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Section renderer
// ─────────────────────────────────────────────────────────────

function getSectionComponent(section: string): React.ComponentType | null {
  switch (section) {
    case 'profile':
      return ProfileView;
    case 'profile-edit':
      return ProfileEdit;
    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────
// MypagePageContent (uses useSearchParams)
// ─────────────────────────────────────────────────────────────

function MypagePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout, hasAccessToSection } = useAuth();

  const [activeSection, setActiveSection] = useState<string>(DEFAULT_SECTION);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [CurrentComponent, setCurrentComponent] = useState<React.ComponentType | null>(null);

  // Sync with URL ?view= param
  useEffect(() => {
    const view = searchParams.get('view');
    const target = isValidSection(view) ? view : DEFAULT_SECTION;
    setActiveSection(target);
    setCurrentComponent(() => getSectionComponent(target));
  }, [searchParams]);

  const handleItemClick = useCallback((itemId: string) => {
    if (!ALL_SECTION_IDS.includes(itemId)) return;
    setActiveSection(itemId);
    setCurrentComponent(() => getSectionComponent(itemId));
    router.push(`/mypage?view=${itemId}`, { scroll: false });
  }, [router]);

  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleBackToMain = useCallback(() => {
    router.push('/main');
  }, [router]);

  const handleAdminClick = useCallback(() => {
    router.push('/admin');
  }, [router]);

  const showAdmin = hasAccessToSection('admin-page');

  return (
    <div className={styles.container}>
      <MypageSidebar
        isOpen={sidebarOpen}
        onToggle={handleSidebarToggle}
        activeItem={activeSection}
        onItemClick={handleItemClick}
        userName={user?.username}
        onLogout={() => logout()}
        onBackToMain={handleBackToMain}
        onAdminClick={showAdmin ? handleAdminClick : undefined}
      />

      <main className={`${styles.content} ${!sidebarOpen ? styles.sidebarCollapsed : ''}`}>
        <Suspense fallback={<LoadingSpinner />}>
          {CurrentComponent ? (
            <CurrentComponent />
          ) : (
            <PlaceholderSection />
          )}
        </Suspense>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Mypage Page with AuthGuard + Suspense
// ─────────────────────────────────────────────────────────────

export default function MypagePage() {
  return (
    <AuthGuard>
      <Suspense fallback={<LoadingSpinner />}>
        <MypagePageContent />
      </Suspense>
    </AuthGuard>
  );
}
