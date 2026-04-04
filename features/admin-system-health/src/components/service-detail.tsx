'use client';

import React from 'react';
import { useTranslation } from '@xgen/i18n';
import type { ServiceInfo } from '../types';

interface ServiceDetailProps {
  service: ServiceInfo;
  onClose: () => void;
}

export const ServiceDetail: React.FC<ServiceDetailProps> = ({ service, onClose }) => {
  const { t } = useTranslation();

  const rows = [
    { label: 'Service ID', value: service.id },
    { label: 'Name', value: service.name },
    { label: 'Health', value: service.health ? 'Healthy' : 'Unhealthy' },
    { label: 'Version', value: service.version ?? '-' },
    { label: 'Version Description', value: service.versionDescription ?? '-' },
    { label: 'Commit Hash', value: service.commitHash ?? '-' },
    { label: 'Commit Date', value: service.commitDate ?? '-' },
    { label: 'Container', value: service.containerName ?? '-' },
    { label: 'Container Description', value: service.containerDescription ?? '-' },
    { label: 'Compatible', value: service.versionCompatible === undefined ? '-' : service.versionCompatible ? 'Yes' : 'No' },
  ];

  if (service.versionCompatibilityReason) {
    rows.push({ label: 'Compatibility Note', value: service.versionCompatibilityReason });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">{service.name}</h3>
        <button
          onClick={onClose}
          className="text-sm px-3 py-1 rounded-md border border-border hover:bg-muted transition-colors"
        >
          {t('common.close', 'Close')}
        </button>
      </div>
      <dl className="grid grid-cols-2 gap-x-8 gap-y-3 max-sm:grid-cols-1">
        {rows.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-xs text-muted-foreground mb-0.5">{label}</dt>
            <dd className="text-sm text-foreground font-mono break-all">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
};
