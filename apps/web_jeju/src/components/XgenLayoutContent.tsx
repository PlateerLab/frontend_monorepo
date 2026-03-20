'use client';

import React, { useState } from 'react';
import XgenSidebar from './XgenSidebar';
import XgenPageContent from './XgenPageContent';

const XgenLayoutContent: React.FC = () => {
  const [activeView, setActiveView] = useState('main-dashboard');

  const handleViewChange = (view: string) => {
    if (view === '__admin__') {
      window.location.href = '/admin';
      return;
    }
    if (view === '__mypage__') {
      window.location.href = '/mypage';
      return;
    }
    setActiveView(view);
  };

  return (
    <div className="flex h-screen">
      <XgenSidebar activeView={activeView} onViewChange={handleViewChange} />
      <XgenPageContent activeView={activeView} onNavigate={handleViewChange} />
    </div>
  );
};

export default XgenLayoutContent;
