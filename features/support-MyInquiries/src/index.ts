'use client';
import React from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

const SupportMyInquiriesPage: React.FC<RouteComponentProps> = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">내 문의 내역</h2>
    <div className="text-sm text-gray-400">내 문의 내역 페이지</div>
  </div>
);

export const supportMyInquiriesFeature: FeatureModule = {
  id: 'support-MyInquiries',
  name: '내 문의 내역',
  sidebarSection: 'support',
  sidebarItems: [
    { id: 'my-inquiries', titleKey: 'support.sidebar.myInquiries.title', descriptionKey: 'support.sidebar.myInquiries.description' },
  ],
  routes: { 'my-inquiries': SupportMyInquiriesPage },
};

export default supportMyInquiriesFeature;