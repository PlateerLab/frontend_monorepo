'use client';
import React from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

const MypageProfileEditPage: React.FC<RouteComponentProps> = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">프로필 수정</h2>
    <div className="text-sm text-gray-400">프로필 수정 페이지</div>
  </div>
);

export const mypageProfileEditFeature: FeatureModule = {
  id: 'mypage-ProfileEdit',
  name: '프로필 수정',
  sidebarSection: 'mypage',
  sidebarItems: [
    { id: 'profile-edit', titleKey: 'mypage.sidebar.profileEdit.title', descriptionKey: 'mypage.sidebar.profileEdit.description' },
  ],
  routes: { 'profile-edit': MypageProfileEditPage },
};

export default mypageProfileEditFeature;