'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from '@xgen/i18n';
import { ContentArea, cn } from '@xgen/ui';
import { fetchUserProfile, type UserProfileDetail } from '@xgen/api-client';

// ─────────────────────────────────────────────────────────────
// Icons (inline SVG — Feather style)
// ─────────────────────────────────────────────────────────────

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
  </svg>
);

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const LoaderIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" /><line x1="4.93" y1="19.07" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// ProfileView Component
// ─────────────────────────────────────────────────────────────

export const ProfileView: React.FC = () => {
  const { t, locale } = useTranslation();
  const [user, setUser] = useState<UserProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const profile = await fetchUserProfile();
        setUser(profile);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('mypage.profile.loadError'));
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [t]);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUserTypeLabel = (userType?: string, isSuperuserFlag?: boolean) => {
    if (isSuperuserFlag) return t('mypage.profile.userType.superuser');
    switch (userType) {
      case 'superuser': return t('mypage.profile.userType.superuser');
      case 'admin': return t('mypage.profile.userType.admin');
      case 'manager': return t('mypage.profile.userType.manager');
      default: return t('mypage.profile.userType.user');
    }
  };

  const isSuperuser = user?.is_superuser ?? user?.user_type === 'superuser';

  if (loading) {
    return (
      <ContentArea title={t('mypage.profile.title')} description={t('mypage.profile.description')}>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <LoaderIcon className="animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t('mypage.profile.loading')}</span>
          </div>
        </div>
      </ContentArea>
    );
  }

  if (error) {
    return (
      <ContentArea title={t('mypage.profile.title')} description={t('mypage.profile.description')}>
        <div className="flex items-center justify-center h-64">
          <span className="text-sm text-destructive">{error}</span>
        </div>
      </ContentArea>
    );
  }

  return (
    <ContentArea title={t('mypage.profile.title')} description={t('mypage.profile.description')}>
      <div className="max-w-2xl mx-auto">
        {/* Avatar + Basic Info Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-5 mb-6">
            {/* Avatar */}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #0891B2 0%, #22D3EE 100%)' }}
            >
              <UserIcon />
            </div>
            {/* Name + Role + Status */}
            <div className="flex flex-col gap-1.5">
              <h2 className="text-lg font-bold text-foreground">
                {user?.full_name || user?.username || t('mypage.profile.user')}
              </h2>
              <span className="text-sm text-muted-foreground">{getUserTypeLabel(user?.user_type, user?.is_superuser)}</span>
              {user?.is_active !== undefined && (
                <span className={cn(
                  'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full w-fit',
                  user.is_active
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-700',
                )}>
                  {user.is_active ? <><CheckIcon /> {t('mypage.profile.status.active')}</> : <><XIcon /> {t('mypage.profile.status.inactive')}</>}
                </span>
              )}
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid gap-4">
            <InfoRow icon={<UserIcon />} label={t('mypage.profile.fields.username')} value={user?.username || '-'} />
            <InfoRow icon={<MailIcon />} label={t('mypage.profile.fields.email')} value={user?.email || '-'} />
            <InfoRow icon={<ShieldIcon />} label={t('mypage.profile.fields.adminPermission')} value={isSuperuser ? t('mypage.profile.permission.yes') : t('mypage.profile.permission.no')} />
            <InfoRow icon={<CalendarIcon />} label={t('mypage.profile.fields.joinDate')} value={formatDate(user?.created_at)} />
            <InfoRow icon={<ClockIcon />} label={t('mypage.profile.fields.lastLogin')} value={user?.last_login ? formatDate(user.last_login) : t('mypage.profile.fields.noRecord')} />
          </div>
        </div>

        {/* Roles & Permissions — 역할 정보 표시 */}
        {!isSuperuser && user?.roles && user.roles.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">{t('mypage.profile.accessPermission.title')}</h3>
            <div className="mb-4">
              <span className="text-xs font-medium text-muted-foreground mb-2 block">
                역할 (Roles)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {user.roles.map((role: string, i: number) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-medium">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Access Permissions — ABAC 권한 표시 */}
        {!isSuperuser && user?.permissions && user.permissions.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">{t('mypage.profile.accessPermission.title')}</h3>
            <div className="flex flex-wrap gap-1.5">
              {user.permissions.map((perm: string, i: number) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                  {perm}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// InfoRow Sub-component
// ─────────────────────────────────────────────────────────────

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-b-0">
    <span className="w-5 h-5 text-muted-foreground flex items-center justify-center flex-shrink-0">{icon}</span>
    <span className="text-sm text-muted-foreground w-28 flex-shrink-0">{label}</span>
    <span className="text-sm font-medium text-foreground">{value}</span>
  </div>
);
