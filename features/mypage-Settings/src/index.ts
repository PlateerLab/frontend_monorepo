'use client';
import React from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

const MypageSettingsPage: React.FC<RouteComponentProps> = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">설정</h2>
    <div className="text-sm text-gray-400">설정 페이지</div>
  </div>
);

export const mypageSettingsFeature: FeatureModule = {
  id: 'mypage-Settings',
  name: '설정',
  sidebarSection: 'mypage',
  sidebarItems: [
    { id: 'settings', titleKey: 'mypage.sidebar.settings.title', descriptionKey: 'mypage.sidebar.settings.description' },
  ],
  routes: { 'settings': MypageSettingsPage },
};

export default mypageSettingsFeature;