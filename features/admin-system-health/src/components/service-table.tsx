'use client';

import React, { useMemo, useState } from 'react';
import { useTranslation } from '@xgen/i18n';
import type { ServiceInfo } from '../types';

interface ServiceTableProps {
  services: ServiceInfo[];
  onSelect: (service: ServiceInfo) => void;
}

export const ServiceTable: React.FC<ServiceTableProps> = ({ services, onSelect }) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () =>
      services.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.id.toLowerCase().includes(search.toLowerCase()),
      ),
    [services, search],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          {t('admin.pages.systemHealth.services', 'Services')}
        </h2>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('admin.pages.systemHealth.search', 'Search services...')}
          className="px-3 py-1.5 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-64"
        />
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground">Service</th>
              <th className="text-center p-3 font-medium text-muted-foreground">Health</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Version</th>
              <th className="text-center p-3 font-medium text-muted-foreground">Compatible</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((service) => (
              <tr
                key={service.id}
                onClick={() => onSelect(service)}
                className="border-t border-border hover:bg-muted/30 cursor-pointer"
              >
                <td className="p-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{service.name}</span>
                    <span className="text-xs text-muted-foreground">{service.id}</span>
                  </div>
                </td>
                <td className="p-3 text-center">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full ${
                      service.health
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${service.health ? 'bg-green-500' : 'bg-red-500'}`} />
                    {service.health ? 'Healthy' : 'Unhealthy'}
                  </span>
                </td>
                <td className="p-3 font-mono text-xs text-muted-foreground">
                  {service.version ?? '-'}
                </td>
                <td className="p-3 text-center">
                  {service.versionCompatible === undefined ? (
                    <span className="text-xs text-muted-foreground">-</span>
                  ) : service.versionCompatible ? (
                    <span className="text-xs text-green-600">✓</span>
                  ) : (
                    <span className="text-xs text-yellow-600" title={service.versionCompatibilityReason}>
                      ⚠
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground">
                  {t('admin.pages.systemHealth.noResults', 'No services found')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
