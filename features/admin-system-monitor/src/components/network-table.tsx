'use client';

import React from 'react';
import { useTranslation } from '@xgen/i18n';
import { formatBytes } from '@xgen/api-client';
import type { NetworkInfo } from '../types';

interface NetworkTableProps {
  networks: NetworkInfo[];
}

export const NetworkTable: React.FC<NetworkTableProps> = ({ networks }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-foreground">
        {t('admin.pages.systemMonitor.network', 'Network')}
      </h2>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground">Interface</th>
              <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Sent</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Received</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Packets Sent</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Packets Recv</th>
            </tr>
          </thead>
          <tbody>
            {networks.map((net, i) => (
              <tr key={i} className="border-t border-border hover:bg-muted/30">
                <td className="p-3 font-mono text-xs">{net.interface}</td>
                <td className="p-3 text-center">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full ${
                      net.is_up
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${net.is_up ? 'bg-green-500' : 'bg-red-500'}`} />
                    {net.is_up ? 'Up' : 'Down'}
                  </span>
                </td>
                <td className="p-3 text-right">{formatBytes(net.bytes_sent)}</td>
                <td className="p-3 text-right">{formatBytes(net.bytes_recv)}</td>
                <td className="p-3 text-right text-muted-foreground">{net.packets_sent.toLocaleString()}</td>
                <td className="p-3 text-right text-muted-foreground">{net.packets_recv.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
