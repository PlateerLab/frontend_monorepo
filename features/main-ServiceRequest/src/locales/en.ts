import type { TranslationData } from '@xgen/i18n';

export const en: TranslationData = {
  serviceRequest: {
    title: 'Service Request',
    searchPlaceholder: 'Search requests...',
    newRequest: 'New Request',
    tabs: { all: 'All', open: 'Open', inProgress: 'In Progress', resolved: 'Resolved' },
    summary: { open: 'Open', inProgress: 'In Progress', resolved: 'Resolved', urgent: 'Urgent' },
    by: 'Requested by',
    view: 'View',
    time: {
      justNow: 'Just now',
      hoursAgo: 'hours ago',
      daysAgo: 'days ago'
    },
    empty: { title: 'No requests', description: 'Create a new request' }
  }
};
