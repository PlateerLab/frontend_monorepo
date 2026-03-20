'use client';
import React from 'react';
import type { AdminSubModule } from '@xgen/types';

const AdminDataScraperPage: React.FC = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">데이터 스크래퍼</h2>
    <div className="text-sm text-gray-400">데이터 스크래퍼 페이지</div>
  </div>
);

export const adminDataScraperModule: AdminSubModule = {
  id: 'admin-DataScraper',
  name: '데이터 스크래퍼',
  sidebarSection: 'data',
  sidebarItems: [
    { id: 'data-scraper', titleKey: 'admin.sidebar.data.dataScraper.title', descriptionKey: 'admin.sidebar.data.dataScraper.description' },
  ],
  routes: { 'data-scraper': AdminDataScraperPage },
};

export default adminDataScraperModule;