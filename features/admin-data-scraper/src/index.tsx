'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea, StatCard } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { FiRefreshCw, FiPlus, FiX } from '@xgen/icons';
import {
  getCrawlerSessions,
  createCrawlerSession,
  cancelCrawlerSession,
} from '@xgen/api-client';
import type { CrawlerSessionSummary, CrawlerSessionStatus } from '@xgen/api-client';

const STATUS_COLORS: Record<CrawlerSessionStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  running: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const AdminDataScraperPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<CrawlerSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [seedUrl, setSeedUrl] = useState('');
  const [maxPages, setMaxPages] = useState(100);
  const [creating, setCreating] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCrawlerSessions();
      setSessions(data);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const stats = useMemo(() => {
    const total = sessions.length;
    const active = sessions.filter((s) => s.status === 'running').length;
    const processed = sessions.reduce((sum, s) => sum + s.processed_pages, 0);
    const pending = sessions.reduce((sum, s) => sum + s.pending_pages, 0);
    const completed = sessions.filter((s) => s.status === 'completed');
    const successRate =
      completed.length > 0
        ? ((completed.length / Math.max(total, 1)) * 100).toFixed(1)
        : '0.0';
    return { total, active, processed, pending, successRate };
  }, [sessions]);

  const handleCreate = useCallback(async () => {
    if (!seedUrl.trim()) return;
    setCreating(true);
    try {
      await createCrawlerSession({ seed_url: seedUrl, max_pages: maxPages });
      setSeedUrl('');
      setShowCreate(false);
      fetchSessions();
    } catch {
      // error handled silently
    } finally {
      setCreating(false);
    }
  }, [seedUrl, maxPages, fetchSessions]);

  const handleCancel = useCallback(
    async (sessionId: string) => {
      try {
        await cancelCrawlerSession(sessionId);
        fetchSessions();
      } catch {
        // error handled silently
      }
    },
    [fetchSessions],
  );

  const statCards = [
    { label: t('admin.pages.dataScraper.totalSessions', 'Total Sessions'), value: stats.total },
    { label: t('admin.pages.dataScraper.activeSessions', 'Active'), value: stats.active },
    { label: t('admin.pages.dataScraper.processedPages', 'Processed Pages'), value: stats.processed },
    { label: t('admin.pages.dataScraper.pendingPages', 'Pending Pages'), value: stats.pending },
    { label: t('admin.pages.dataScraper.successRate', 'Success Rate'), value: `${stats.successRate}%` },
  ];

  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {t('admin.pages.dataScraper.title', 'Data Scraper')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('admin.pages.dataScraper.description', 'Manage web scraping sessions')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <FiPlus className="w-4 h-4" /> New Session
            </button>
            <button
              onClick={fetchSessions}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 max-lg:grid-cols-3 max-sm:grid-cols-2">
          {statCards.map(({ label, value }, idx) => (
            <StatCard
              key={label}
              label={label}
              value={value}
              variant={(['info', 'success', 'neutral', 'warning', 'error'] as const)[idx] ?? 'neutral'}
            />
          ))}
        </div>

        {/* Create Form */}
        {showCreate && (
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Create Session</h3>
              <button onClick={() => setShowCreate(false)}>
                <FiX className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">Seed URL</label>
                <input
                  type="url"
                  value={seedUrl}
                  onChange={(e) => setSeedUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-1.5 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="w-32">
                <label className="text-xs text-muted-foreground mb-1 block">Max Pages</label>
                <input
                  type="number"
                  value={maxPages}
                  onChange={(e) => setMaxPages(Number(e.target.value))}
                  min={1}
                  className="w-full px-3 py-1.5 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={creating || !seedUrl.trim()}
                className="px-4 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        )}

        {/* Session List */}
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">URL</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Processed</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Pending</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Created</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.session_id} className="border-t border-border hover:bg-muted/30">
                  <td className="p-3 max-w-64 truncate font-mono text-xs">{session.seed_url}</td>
                  <td className="p-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[session.status]}`}>
                      {session.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">{session.processed_pages}</td>
                  <td className="p-3 text-right">{session.pending_pages}</td>
                  <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(session.created_at).toLocaleString()}
                  </td>
                  <td className="p-3 text-center">
                    {session.status === 'running' && (
                      <button
                        onClick={() => handleCancel(session.session_id)}
                        className="text-xs text-red-600 hover:text-red-700 px-2 py-0.5 rounded border border-red-200 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    {session.error && (
                      <span className="text-xs text-red-500" title={session.error}>⚠</span>
                    )}
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    {t('admin.pages.dataScraper.noSessions', 'No scraping sessions')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ContentArea>
  );
};

const feature: AdminFeatureModule = {
  id: 'admin-data-scraper',
  name: 'AdminDataScraperPage',
  adminSection: 'admin-data',
  routes: {
    'admin-data-scraper': AdminDataScraperPage,
  },
};

export default feature;
