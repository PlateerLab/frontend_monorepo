'use client';
import React from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

const SupportInquiryPage: React.FC<RouteComponentProps> = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">1:1 문의</h2>
    <div className="text-sm text-gray-400">1:1 문의 페이지</div>
  </div>
);

export const supportInquiryFeature: FeatureModule = {
  id: 'support-Inquiry',
  name: '1:1 문의',
  sidebarSection: 'support',
  sidebarItems: [
    { id: 'inquiry', titleKey: 'support.sidebar.inquiry.title', descriptionKey: 'support.sidebar.inquiry.description' },
  ],
  routes: { 'inquiry': SupportInquiryPage },
};

export default supportInquiryFeature;