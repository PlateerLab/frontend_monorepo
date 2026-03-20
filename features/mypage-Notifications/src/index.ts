'use client';
import React from 'react';
import type { FeatureModule, RouteComponentProps } from '@xgen/types';

const MypageNotificationsPage: React.FC<RouteComponentProps> = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">알림</h2>
    <div className="text-sm text-gray-400">알림 페이지</div>
  </div>
);

export const mypageNotificationsFeature: FeatureModule = {
  id: 'mypage-Notifications',
  name: '알림',
  sidebarSection: 'mypage',
  sidebarItems: [
    { id: 'notifications', titleKey: 'mypage.sidebar.notifications.title', descriptionKey: 'mypage.sidebar.notifications.description' },
  ],
  routes: { 'notifications': MypageNotificationsPage },
};

export default mypageNotificationsFeature;