'use client';

import React from 'react';
import { useTranslation } from '@xgen/i18n';
import type { ConnectionState } from '../types';

interface ConnectionStatusProps {
  state: ConnectionState;
  isStreaming: boolean;
  onToggle: () => void;
}

const stateConfig: Record<ConnectionState, { color: string; bg: string; label: string }> = {
  connecting: { color: 'bg-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900', label: 'Connecting...' },
  connected: { color: 'bg-green-500', bg: 'bg-green-100 dark:bg-green-900', label: 'Connected' },
  disconnected: { color: 'bg-red-500', bg: 'bg-red-100 dark:bg-red-900', label: 'Disconnected' },
};

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ state, isStreaming, onToggle }) => {
  const { t } = useTranslation();
  const config = stateConfig[state];

  return (
    <div className="flex items-center gap-3">
      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${config.bg}`}>
        <span className={`w-2 h-2 rounded-full ${config.color} ${state === 'connected' ? 'animate-pulse' : ''}`} />
        {config.label}
      </span>
      <button
        onClick={onToggle}
        className={`text-xs px-3 py-1 rounded-md border transition-colors ${
          isStreaming
            ? 'border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950'
            : 'border-green-300 text-green-600 hover:bg-green-50 dark:hover:bg-green-950'
        }`}
      >
        {isStreaming
          ? t('admin.pages.systemMonitor.pause', 'Pause')
          : t('admin.pages.systemMonitor.resume', 'Resume')
        }
      </button>
    </div>
  );
};
