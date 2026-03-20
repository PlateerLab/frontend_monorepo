'use client';
import React from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

const SupportServiceRequestResultsPage: React.FC<RouteComponentProps> = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">요청 결과</h2>
    <div className="text-sm text-gray-400">요청 결과 페이지</div>
  </div>
);

export const supportServiceRequestResultsFeature: FeatureModule = {
  id: 'support-ServiceRequestResults',
  name: '요청 결과',
  sidebarSection: 'support',
  sidebarItems: [
    { id: 'service-request-results', titleKey: 'support.sidebar.serviceRequestResults.title', descriptionKey: 'support.sidebar.serviceRequestResults.description' },
  ],
  routes: { 'service-request-results': SupportServiceRequestResultsPage },
};

export default supportServiceRequestResultsFeature;