'use client';
import React from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

const SupportServiceRequestFormPage: React.FC<RouteComponentProps> = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">업무 요청</h2>
    <div className="text-sm text-gray-400">업무 요청 페이지</div>
  </div>
);

export const supportServiceRequestFormFeature: FeatureModule = {
  id: 'support-ServiceRequestForm',
  name: '업무 요청',
  sidebarSection: 'support',
  sidebarItems: [
    { id: 'service-request-form', titleKey: 'support.sidebar.serviceRequestForm.title', descriptionKey: 'support.sidebar.serviceRequestForm.description' },
  ],
  routes: { 'service-request-form': SupportServiceRequestFormPage },
};

export default supportServiceRequestFormFeature;