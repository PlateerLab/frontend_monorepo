'use client';
import React from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

const AuthProfileStore: React.FC<RouteComponentProps> = () => (
  <div className="flex flex-col h-full p-6">
    <h2 className="font-semibold text-lg mb-4">인증 프로필 스토어</h2>
    <div className="flex-1 text-center text-gray-400 py-12">스토어 데이터가 없습니다</div>
  </div>
);

export const authProfileStoreFeature: FeatureModule = {
  id: 'main-AuthProfileManagement-Store',
  name: 'Auth Profile Store',
  sidebarSection: 'workflow',
  sidebarItems: [
    { id: 'auth-profile', titleKey: 'workflow.authProfile.title', descriptionKey: 'workflow.authProfile.description' },
  ],
  routes: { 'auth-profile-store': AuthProfileStore },
};

export default authProfileStoreFeature;