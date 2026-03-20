'use client';
import React from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

const MypageSecurityPage: React.FC<RouteComponentProps> = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">보안</h2>
    <div className="text-sm text-gray-400">보안 페이지</div>
  </div>
);

export const mypageSecurityFeature: FeatureModule = {
  id: 'mypage-Security',
  name: '보안',
  sidebarSection: 'mypage',
  sidebarItems: [
    { id: 'security', titleKey: 'mypage.sidebar.security.title', descriptionKey: 'mypage.sidebar.security.description' },
  ],
  routes: { 'security': MypageSecurityPage },
};

export default mypageSecurityFeature;