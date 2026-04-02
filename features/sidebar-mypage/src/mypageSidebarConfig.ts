// ─────────────────────────────────────────────────────────────
// MypageSidebar Configuration
// i18n key 기반 — 런타임에 t()로 변환
// ─────────────────────────────────────────────────────────────

export interface MypageSidebarItem {
  id: string;
  titleKey: string;
  descriptionKey: string;
}

export interface MypageSidebarSection {
  id: string;
  titleKey: string;
  items: MypageSidebarItem[];
}

export const mypageSidebarConfig: MypageSidebarSection[] = [
  {
    id: 'profile',
    titleKey: 'mypage.sidebar.sections.profile',
    items: [
      {
        id: 'profile',
        titleKey: 'mypage.sidebar.profile',
        descriptionKey: 'mypage.sidebar.profileDesc',
      },
      {
        id: 'profile-edit',
        titleKey: 'mypage.sidebar.profileEdit',
        descriptionKey: 'mypage.sidebar.profileEditDesc',
      },
    ],
  },
  {
    id: 'settings',
    titleKey: 'mypage.sidebar.sections.settings',
    items: [
      {
        id: 'settings',
        titleKey: 'mypage.sidebar.settings',
        descriptionKey: 'mypage.sidebar.settingsDesc',
      },
      {
        id: 'security',
        titleKey: 'mypage.sidebar.security',
        descriptionKey: 'mypage.sidebar.securityDesc',
      },
      {
        id: 'notifications',
        titleKey: 'mypage.sidebar.notifications',
        descriptionKey: 'mypage.sidebar.notificationsDesc',
      },
    ],
  },
];

// Section Icons (inline SVG)
export const MYPAGE_SECTION_ICONS: Record<string, React.ReactNode> = {};
