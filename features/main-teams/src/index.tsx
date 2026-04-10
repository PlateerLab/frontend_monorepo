'use client';

import type { MainFeatureModule, RouteComponentProps } from '@xgen/types';
import './locales';
import TeamsPage from './TeamsPage';

// ─────────────────────────────────────────────────────────────
// Feature Export
// ─────────────────────────────────────────────────────────────

const TeamsRoute: React.FC<RouteComponentProps> = () => <TeamsPage />;

export const mainTeamsFeature: MainFeatureModule = {
  id: 'main-teams',
  name: 'Teams',
  sidebarSection: 'chat',
  sidebarItems: [
    {
      id: 'teams',
      titleKey: 'sidebar.chat.teams.title',
      descriptionKey: 'sidebar.chat.teams.description',
    },
  ],
  routes: {
    teams: TeamsRoute,
  },
  requiresAuth: true,
};

export default mainTeamsFeature;
export { TeamsPage };
