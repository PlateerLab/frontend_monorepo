'use client';

import React from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { ContentArea, Button, Card, FormField, Toggle } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { useAuth } from '@xgen/auth-provider';

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const UserIcon: React.FC = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="16" r="8" stroke="currentColor" strokeWidth="2.5"/>
    <path d="M10 42C10 33.163 16.163 26 25 26C33.837 26 40 33.163 40 42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

const KeyIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.917 8.333C14.757 8.333 16.25 6.84 16.25 5C16.25 3.16 14.757 1.667 12.917 1.667C11.077 1.667 9.583 3.16 9.583 5C9.583 5.39 9.655 5.762 9.783 6.108L1.667 14.225V18.333H5.833V15.833H8.333V13.333H10.833L12.225 11.942C12.455 11.992 12.692 12.017 12.933 12.017" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ShieldIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 18.333S16.667 15 16.667 10V4.167L10 1.667L3.333 4.167V10C3.333 15 10 18.333 10 18.333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const BellIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 6.667A5 5 0 005 6.667C5 12.5 2.5 14.167 2.5 14.167H17.5S15 12.5 15 6.667M11.442 17.5A1.667 1.667 0 018.558 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LogoutIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.5 17.5H4.167C3.706 17.5 3.264 17.317 2.94 16.988C2.616 16.66 2.436 16.21 2.436 15.75V4.17C2.436 3.71 2.616 3.26 2.94 2.932C3.264 2.603 3.706 2.42 4.167 2.42H7.5M13.333 14.167L17.5 10M17.5 10L13.333 5.833M17.5 10H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  container: { padding: '24px', maxWidth: '800px', margin: '0 auto' },
  profileHeader: { display: 'flex', alignItems: 'center', gap: '24px', padding: '32px', background: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', marginBottom: '24px' },
  avatar: { width: '96px', height: '96px', borderRadius: '50%', background: 'linear-gradient(135deg, #305EEB 0%, #6366F1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '36px', fontWeight: 600 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: '24px', fontWeight: 700, color: '#1F2937', margin: '0 0 4px' },
  profileEmail: { fontSize: '14px', color: '#6B7280', margin: '0 0 8px' },
  profileRole: { display: 'inline-block', padding: '4px 12px', background: 'rgba(48, 94, 235, 0.1)', borderRadius: '4px', fontSize: '12px', color: '#305EEB', fontWeight: 500 },
  section: { background: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', marginBottom: '24px', overflow: 'hidden' },
  sectionHeader: { padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '12px' },
  sectionIcon: { width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(48, 94, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#305EEB' },
  sectionTitle: { fontSize: '16px', fontWeight: 600, color: '#1F2937', margin: 0 },
  sectionContent: { padding: '24px' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
  toggleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #F3F4F6' },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: '14px', fontWeight: 500, color: '#1F2937', margin: '0 0 4px' },
  toggleDesc: { fontSize: '12px', color: '#6B7280', margin: 0 },
  dangerZone: { backgroundColor: 'rgba(239, 68, 68, 0.02)', borderColor: 'rgba(239, 68, 68, 0.2)' },
  dangerButton: { color: '#EF4444', borderColor: '#EF4444' },
};

// ─────────────────────────────────────────────────────────────
// Auth Profile Page
// ─────────────────────────────────────────────────────────────

interface AuthProfilePageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
}

const AuthProfilePage: React.FC<AuthProfilePageProps> = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  // Mock user data
  const mockUser = user || {
    id: 'user-001',
    name: '김철수',
    email: 'user@example.com',
    role: 'Admin',
    department: '기술팀',
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <ContentArea title={t('profile.title')}>
      <div style={styles.container}>
        {/* Profile Header */}
        <div style={styles.profileHeader}>
          <div style={styles.avatar}>
            {getInitials(mockUser.name || 'U')}
          </div>
          <div style={styles.profileInfo}>
            <h1 style={styles.profileName}>{mockUser.name}</h1>
            <p style={styles.profileEmail}>{mockUser.email}</p>
            <span style={styles.profileRole}>{mockUser.role || 'User'}</span>
          </div>
          <Button variant="outline">
            {t('profile.editProfile')}
          </Button>
        </div>

        {/* Account Settings */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionIcon}>
              <KeyIcon />
            </div>
            <h2 style={styles.sectionTitle}>{t('profile.accountSettings')}</h2>
          </div>
          <div style={styles.sectionContent}>
            <div style={styles.formRow}>
              <FormField
                label={t('profile.name')}
                value={mockUser.name}
                disabled
              />
              <FormField
                label={t('profile.email')}
                value={mockUser.email}
                disabled
              />
            </div>
            <Button variant="outline">
              {t('profile.changePassword')}
            </Button>
          </div>
        </section>

        {/* Security */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionIcon}>
              <ShieldIcon />
            </div>
            <h2 style={styles.sectionTitle}>{t('profile.security')}</h2>
          </div>
          <div style={styles.sectionContent}>
            <div style={styles.toggleRow}>
              <div style={styles.toggleInfo}>
                <p style={styles.toggleLabel}>{t('profile.twoFactor')}</p>
                <p style={styles.toggleDesc}>{t('profile.twoFactorDesc')}</p>
              </div>
              <Toggle checked={false} onChange={() => {}} />
            </div>
            <div style={{ ...styles.toggleRow, borderBottom: 'none' }}>
              <div style={styles.toggleInfo}>
                <p style={styles.toggleLabel}>{t('profile.sessionTimeout')}</p>
                <p style={styles.toggleDesc}>{t('profile.sessionTimeoutDesc')}</p>
              </div>
              <Toggle checked={true} onChange={() => {}} />
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionIcon}>
              <BellIcon />
            </div>
            <h2 style={styles.sectionTitle}>{t('profile.notifications')}</h2>
          </div>
          <div style={styles.sectionContent}>
            <div style={styles.toggleRow}>
              <div style={styles.toggleInfo}>
                <p style={styles.toggleLabel}>{t('profile.emailNotifications')}</p>
                <p style={styles.toggleDesc}>{t('profile.emailNotificationsDesc')}</p>
              </div>
              <Toggle checked={true} onChange={() => {}} />
            </div>
            <div style={{ ...styles.toggleRow, borderBottom: 'none' }}>
              <div style={styles.toggleInfo}>
                <p style={styles.toggleLabel}>{t('profile.workflowAlerts')}</p>
                <p style={styles.toggleDesc}>{t('profile.workflowAlertsDesc')}</p>
              </div>
              <Toggle checked={true} onChange={() => {}} />
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section style={{ ...styles.section, ...styles.dangerZone }}>
          <div style={styles.sectionHeader}>
            <div style={{ ...styles.sectionIcon, background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
              <LogoutIcon />
            </div>
            <h2 style={styles.sectionTitle}>{t('profile.dangerZone')}</h2>
          </div>
          <div style={styles.sectionContent}>
            <Button variant="outline" style={styles.dangerButton} onClick={logout}>
              <LogoutIcon />
              {t('profile.logout')}
            </Button>
          </div>
        </section>
      </div>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Export
// ─────────────────────────────────────────────────────────────

export const mainAuthProfileFeature: MainFeatureModule = {
  id: 'main-AuthProfile',
  name: 'Profile',
  sidebarSection: 'workflow',
  sidebarItems: [
    {
      id: 'auth-profile',
      titleKey: 'sidebar.workflow.profile.title',
      descriptionKey: 'sidebar.workflow.profile.description',
    },
  ],
  routes: {
    'auth-profile': AuthProfilePage,
  },
  requiresAuth: true,
};

export default mainAuthProfileFeature;
