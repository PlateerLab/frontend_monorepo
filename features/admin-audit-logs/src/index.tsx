'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea, Button, SearchInput, StatusBadge, Modal } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { getSystemAuditLogs } from '@xgen/api-client';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface AuditEvent {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  category: 'auth' | 'admin' | 'data' | 'system' | 'api';
  resource: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failure' | 'warning';
  details: Record<string, string>;
}

type CategoryFilter = AuditEvent['category'] | 'all';
type StatusFilter = AuditEvent['status'] | 'all';

const CATEGORY_LABELS: Record<AuditEvent['category'], string> = {
  auth: 'Authentication',
  admin: 'Admin Action',
  data: 'Data Access',
  system: 'System',
  api: 'API Call',
};

const ACTION_SAMPLES: string[] = [
  'login', 'logout', 'login_failed', 'password_change', 'mfa_setup',
  'user_create', 'user_update', 'user_delete', 'role_change', 'permission_grant',
  'query_execute', 'data_export', 'data_import', 'file_upload', 'file_delete',
  'config_update', 'service_restart', 'backup_create',
  'api_key_create', 'api_key_revoke', 'rate_limit_exceeded',
];

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */
function generateAuditEvents(): AuditEvent[] {
  const users = [
    { id: 'u1', name: 'admin@xgen.io' },
    { id: 'u2', name: 'operator@xgen.io' },
    { id: 'u3', name: 'dev@xgen.io' },
    { id: 'u4', name: 'service-account' },
  ];
  const categories: AuditEvent['category'][] = ['auth', 'admin', 'data', 'system', 'api'];
  const statuses: AuditEvent['status'][] = ['success', 'success', 'success', 'failure', 'warning'];
  const ips = ['10.0.1.42', '192.168.1.100', '10.0.2.15', '172.16.0.5'];

  return Array.from({ length: 80 }, (_, i) => {
    const user = users[i % users.length];
    const cat = categories[i % categories.length];
    const action = ACTION_SAMPLES[i % ACTION_SAMPLES.length];
    return {
      id: `audit-${String(i + 1).padStart(4, '0')}`,
      timestamp: new Date(Date.now() - i * 900000).toISOString(),
      userId: user.id,
      userName: user.name,
      action,
      category: cat,
      resource: `/${cat}/${action}`,
      ipAddress: ips[i % ips.length],
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: statuses[i % statuses.length],
      details: {
        method: i % 2 === 0 ? 'POST' : 'GET',
        duration_ms: String(50 + (i * 7) % 500),
        ...(action.includes('failed') ? { reason: 'Invalid credentials' } : {}),
      },
    };
  });
}

const PAGE_SIZE = 25;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
const AdminAuditLogsPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getSystemAuditLogs();
        if (data.events && data.events.length > 0) {
          setEvents(data.events.map(e => ({
            id: e.id,
            timestamp: e.timestamp ?? new Date().toISOString(),
            userId: e.userEmail ?? '',
            userName: e.userName,
            action: e.action,
            category: e.category === 'config' || e.category === 'workflow' ? 'admin' : e.category as AuditEvent['category'],
            resource: e.resource,
            ipAddress: e.ipAddress,
            userAgent: e.userAgent,
            status: e.status === 'info' ? 'success' : e.status as AuditEvent['status'],
            details: typeof e.details === 'string' ? { info: e.details } : (e.details as unknown as Record<string, string>) ?? {},
          })));
        } else {
          setEvents(generateAuditEvents());
        }
      } catch {
        setEvents(generateAuditEvents());
      }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return events.filter(e => {
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return e.userName.toLowerCase().includes(q) ||
               e.action.toLowerCase().includes(q) ||
               e.resource.toLowerCase().includes(q) ||
               e.ipAddress.includes(q);
      }
      return true;
    });
  }, [events, search, categoryFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const stats = useMemo(() => ({
    total: events.length,
    success: events.filter(e => e.status === 'success').length,
    failure: events.filter(e => e.status === 'failure').length,
    warning: events.filter(e => e.status === 'warning').length,
  }), [events]);

  const statusBadge = (status: AuditEvent['status']) => {
    const map = { success: 'success', failure: 'error', warning: 'warning' } as const;
    return <StatusBadge status={map[status]}>{status}</StatusBadge>;
  };

  return (
    <ContentArea
      title={t('admin.pages.auditLogs.title', 'Audit Logs')}
      description={t('admin.pages.auditLogs.description', 'Security and system audit event trail')}
    >
      {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: t('admin.audit.totalEvents', 'Total Events'), value: stats.total, color: 'text-blue-600' },
            { label: t('common.success', 'Success'), value: stats.success, color: 'text-green-600' },
            { label: t('common.failure', 'Failure'), value: stats.failure, color: 'text-red-600' },
            { label: t('common.warning', 'Warning'), value: stats.warning, color: 'text-yellow-600' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{loading ? '—' : s.value}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-72">
            <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(0); }} placeholder={t('admin.audit.searchPlaceholder', 'Search by user, action, resource, IP...')} />
          </div>

          <div className="flex gap-2">
            {(['all', 'auth', 'admin', 'data', 'system', 'api'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => { setCategoryFilter(cat); setPage(0); }}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  categoryFilter === cat
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                }`}
              >
                {cat === 'all' ? t('common.all', 'All') : CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          <div className="flex gap-2 ml-auto">
            {(['all', 'success', 'failure', 'warning'] as const).map(st => (
              <button
                key={st}
                onClick={() => { setStatusFilter(st); setPage(0); }}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  statusFilter === st
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                }`}
              >
                {st === 'all' ? t('common.allStatus', 'All Status') : st}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 text-left">
                  <th className="px-4 py-3 font-semibold text-xs text-muted-foreground tracking-wide">{t('admin.audit.time', 'Time')}</th>
                  <th className="px-4 py-3 font-semibold text-xs text-muted-foreground tracking-wide">{t('admin.audit.user', 'User')}</th>
                  <th className="px-4 py-3 font-semibold text-xs text-muted-foreground tracking-wide">{t('admin.audit.action', 'Action')}</th>
                  <th className="px-4 py-3 font-semibold text-xs text-muted-foreground tracking-wide">{t('admin.audit.category', 'Category')}</th>
                  <th className="px-4 py-3 font-semibold text-xs text-muted-foreground tracking-wide">{t('admin.audit.resource', 'Resource')}</th>
                  <th className="px-4 py-3 font-semibold text-xs text-muted-foreground tracking-wide">{t('admin.audit.ip', 'IP')}</th>
                  <th className="px-4 py-3 font-semibold text-xs text-muted-foreground tracking-wide">{t('common.status', 'Status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paged.map(e => (
                  <tr
                    key={e.id}
                    onClick={() => setSelectedEvent(e)}
                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                      {new Date(e.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{e.userName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{e.action}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground">
                        {CATEGORY_LABELS[e.category]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.resource}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.ipAddress}</td>
                    <td className="px-4 py-3">{statusBadge(e.status)}</td>
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      {t('common.noResults', 'No results found')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t('common.showingOf', { current: `${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, filtered.length)}`, total: filtered.length }, `${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, filtered.length)} of ${filtered.length}`)}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                {t('common.previous', 'Previous')}
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                {t('common.next', 'Next')}
              </Button>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {selectedEvent && (
          <Modal isOpen onClose={() => setSelectedEvent(null)} title={`Audit Event: ${selectedEvent.action}`}>
            <div className="flex flex-col gap-4 p-4">
              {[
                { label: 'Event ID', value: selectedEvent.id },
                { label: 'Timestamp', value: new Date(selectedEvent.timestamp).toLocaleString() },
                { label: 'User', value: `${selectedEvent.userName} (${selectedEvent.userId})` },
                { label: 'Action', value: selectedEvent.action },
                { label: 'Category', value: CATEGORY_LABELS[selectedEvent.category] },
                { label: 'Resource', value: selectedEvent.resource },
                { label: 'IP Address', value: selectedEvent.ipAddress },
                { label: 'User Agent', value: selectedEvent.userAgent },
                { label: 'Status', value: selectedEvent.status },
              ].map(row => (
                <div key={row.label} className="flex justify-between py-1 border-b border-border last:border-b-0">
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                  <span className="text-sm text-foreground font-mono">{row.value}</span>
                </div>
              ))}

              {Object.keys(selectedEvent.details).length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">{t('common.details', 'Details')}</p>
                  <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs font-mono">
                    {Object.entries(selectedEvent.details).map(([k, v]) => (
                      <div key={k} className="flex justify-between py-0.5">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="text-foreground">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                  {t('common.close', 'Close')}
                </Button>
              </div>
            </div>
          </Modal>
        )}
    </ContentArea>
  );
};

const feature: AdminFeatureModule = {
  id: 'admin-audit-logs',
  name: 'AdminAuditLogsPage',
  adminSection: 'admin-security',
  routes: {
    'admin-audit-logs': AdminAuditLogsPage,
  },
};

export default feature;
