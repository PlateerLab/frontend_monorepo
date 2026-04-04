'use client';

import React from 'react';
import { useTranslation } from '@xgen/i18n';
import { formatBytes } from '@xgen/api-client';
import type { DiskInfo } from '../types';

interface DiskTableProps {
  disks: DiskInfo[];
}

export const DiskTable: React.FC<DiskTableProps> = ({ disks }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-foreground">
        {t('admin.pages.systemMonitor.disk', 'Disk')}
      </h2>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground">Device</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Mount</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Total</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Used</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Free</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Usage</th>
            </tr>
          </thead>
          <tbody>
            {disks.map((disk, i) => (
              <tr key={i} className="border-t border-border hover:bg-muted/30">
                <td className="p-3 font-mono text-xs">{disk.device}</td>
                <td className="p-3 font-mono text-xs">{disk.mountpoint}</td>
                <td className="p-3 text-muted-foreground">{disk.fstype}</td>
                <td className="p-3 text-right">{formatBytes(disk.total)}</td>
                <td className="p-3 text-right">{formatBytes(disk.used)}</td>
                <td className="p-3 text-right">{formatBytes(disk.free)}</td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          disk.percent >= 90
                            ? 'bg-red-500'
                            : disk.percent >= 80
                              ? 'bg-orange-500'
                              : 'bg-green-500'
                        }`}
                        style={{ width: `${disk.percent}%` }}
                      />
                    </div>
                    <span className="text-xs w-10 text-right">{disk.percent.toFixed(1)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
