// ─────────────────────────────────────────────────────────────
// SupportSidebar Configuration
// i18n key 기반 — 런타임에 t()로 변환
// ─────────────────────────────────────────────────────────────

export interface SupportSidebarItem {
  id: string;
  titleKey: string;
  descriptionKey: string;
}

export interface SupportSidebarSection {
  id: string;
  titleKey: string;
  items: SupportSidebarItem[];
}

export const supportSidebarConfig: SupportSidebarSection[] = [
  {
    id: 'customer-support',
    titleKey: 'support.sidebar.sections.customerSupport',
    items: [
      {
        id: 'faq',
        titleKey: 'support.sidebar.faq',
        descriptionKey: 'support.sidebar.faqDesc',
      },
      {
        id: 'inquiry',
        titleKey: 'support.sidebar.inquiry',
        descriptionKey: 'support.sidebar.inquiryDesc',
      },
      {
        id: 'my-inquiries',
        titleKey: 'support.sidebar.myInquiries',
        descriptionKey: 'support.sidebar.myInquiriesDesc',
      },
    ],
  },
  {
    id: 'service-request',
    titleKey: 'support.sidebar.sections.serviceRequest',
    items: [
      {
        id: 'service-request-form',
        titleKey: 'support.sidebar.serviceRequestForm',
        descriptionKey: 'support.sidebar.serviceRequestFormDesc',
      },
      {
        id: 'service-request-results',
        titleKey: 'support.sidebar.serviceRequestResults',
        descriptionKey: 'support.sidebar.serviceRequestResultsDesc',
      },
    ],
  },
];
