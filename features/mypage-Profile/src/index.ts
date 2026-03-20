'use client';
import React from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

const MypageProfilePage: React.FC<RouteComponentProps> = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">프로필</h2>
    <div className="text-sm text-gray-400">프로필 페이지</div>
  </div>
);

export const mypageProfileFeature: FeatureModule = {
  id: 'mypage-Profile',
  name: '프로필',
  sidebarSection: 'mypage',
  sidebarItems: [
    { id: 'profile', titleKey: 'mypage.sidebar.profile.title', descriptionKey: 'mypage.sidebar.profile.description' },
  ],
  routes: { 'profile': MypageProfilePage },
};

export default mypageProfileFeature;