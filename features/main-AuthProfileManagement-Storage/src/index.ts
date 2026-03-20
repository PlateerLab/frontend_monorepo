'use client';
import React from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

const AuthProfileStorage: React.FC<RouteComponentProps> = () => (
  <div className="flex flex-col h-full p-6">
    <h2 className="font-semibold text-lg mb-4">인증 프로필 저장소</h2>
    <div className="flex-1 text-center text-gray-400 py-12">저장된 프로필이 없습니다</div>
  </div>
);

export const authProfileStorageFeature: FeatureModule = {
  id: 'main-AuthProfileManagement-Storage',
  name: 'Auth Profile Storage',
  sidebarSection: 'workflow',
  sidebarItems: [
    { id: 'auth-profile', titleKey: 'workflow.authProfile.title', descriptionKey: 'workflow.authProfile.description' },
  ],
  routes: { 'auth-profile-storage': AuthProfileStorage },
};

export default authProfileStorageFeature;