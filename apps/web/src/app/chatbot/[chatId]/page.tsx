'use client';

import React from 'react';
import { registry } from '@/features';

export default function ChatbotPage() {
  const mod = registry.get('chatbot');
  if (mod?.pageRoutes) {
    const Component = mod.pageRoutes['/chatbot/[chatId]'];
    if (Component) return <Component />;
  }
  return <div className="flex items-center justify-center h-screen text-gray-400">Chatbot module not loaded</div>;
}
