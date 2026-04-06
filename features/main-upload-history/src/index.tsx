'use client';

import type { MainFeatureModule } from '@xgen/types';
import { UploadHistoryPage } from './components/UploadHistoryPage';
import './locales';

// ─────────────────────────────────────────────────────────────
// Feature Export
// ─────────────────────────────────────────────────────────────

export const mainUploadHistoryFeature: MainFeatureModule = {
  id: 'main-upload-history',
  name: 'Upload History',
  sidebarSection: 'knowledge',
  sidebarItems: [
    {
      id: 'upload-history',
      titleKey: 'sidebar.knowledge.uploadHistory.title',
      descriptionKey: 'sidebar.knowledge.uploadHistory.description',
    },
  ],
  routes: {
    'upload-history': UploadHistoryPage,
  },
  requiresAuth: true,
};

export default mainUploadHistoryFeature;
export { UploadHistoryPage };
