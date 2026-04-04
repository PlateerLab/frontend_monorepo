'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea, Button, SearchInput, StatusBadge, Modal } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import {
  getSecurityPolicies,
  getIPRules as fetchIPRules,
  getTokenPolicies as fetchTokenPolicies,
  toggleSecurityPolicy,
  type SecurityPolicy as ApiSecurityPolicy,
  type IPRule as ApiIPRule,
  type TokenPolicy as ApiTokenPolicy,
} from '@xgen/api-client';

/* ------------------------------------------------------------------ */
/*  Types (extended from API types for local UI)                       */
/* ------------------------------------------------------------------ */
interface SecurityPolicy {
  id: string;
  name: string;
  category: 'authentication' | 'authorization' | 'data' | 'network' | 'compliance';
  severity?: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
  description: string;
  config: Record<string, string | number | boolean>;
  updatedAt: string;
}

interface IPRule {
  id: string;
  ip: string;
  type: 'allow' | 'block';
  description: string;
  createdAt: string;
}

type TabId = 'policies' | 'ip_rules' | 'tokens';

interface TokenPolicy {
  id: string;
  name: string;
  expiresIn: number; // hours
  maxActive: number;
  refreshEnabled: boolean;
  updatedAt: string;
}

const CATEGORY_LABELS: Record<SecurityPolicy['category'], string> = {
  authentication: 'Authentication',
  authorization: 'Authorization',
  data: 'Data Protection',
  network: 'Network',
  compliance: 'Compliance',
};

/* ------------------------------------------------------------------ */
/*  Mock data generators                                               */
/* ------------------------------------------------------------------ */
function generatePolicies(): SecurityPolicy[] {
  return [
    {
      id: 'pol-1', name: 'Multi-Factor Authentication', category: 'authentication',
      enabled: true, description: 'Require MFA for all admin accounts',
      config: { enforced: true, methods: 'totp,sms' }, updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'pol-2', name: 'Session Timeout', category: 'authentication',
      enabled: true, description: 'Auto-logout after inactivity',
      config: { timeout_minutes: 30 }, updatedAt: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: 'pol-3', name: 'IP Whitelist Enforcement', category: 'network',
      enabled: false, description: 'Restrict API access to whitelisted IPs only',
      config: { strict: false }, updatedAt: new Date(Date.now() - 259200000).toISOString(),
    },
    {
      id: 'pol-4', name: 'CORS Policy', category: 'network',
      enabled: true, description: 'Cross-Origin Resource Sharing restrictions',
      config: { allowed_origins: '*', allow_credentials: true }, updatedAt: new Date(Date.now() - 345600000).toISOString(),
    },
    {
      id: 'pol-5', name: 'Role-Based Access Control', category: 'authorization',
      enabled: true, description: 'Enforce RBAC for all API endpoints',
      config: { default_role: 'viewer', admin_mfa_required: true }, updatedAt: new Date(Date.now() - 432000000).toISOString(),
    },
    {
      id: 'pol-6', name: 'PII Encryption at Rest', category: 'data',
      enabled: true, description: 'Encrypt personally identifiable information in database',
      config: { algorithm: 'AES-256', key_rotation_days: 90 }, updatedAt: new Date(Date.now() - 518400000).toISOString(),
    },
    {
      id: 'pol-7', name: 'Audit Trail Retention', category: 'compliance',
      enabled: true, description: 'Retain audit logs for compliance',
      config: { retention_days: 365 }, updatedAt: new Date(Date.now() - 604800000).toISOString(),
    },
  ];
}

function generateIPRules(): IPRule[] {
  return [
    { id: 'ip-1', ip: '10.0.0.0/8', type: 'allow', description: 'Internal network', createdAt: new Date(Date.now() - 86400000 * 30).toISOString() },
    { id: 'ip-2', ip: '192.168.1.0/24', type: 'allow', description: 'Office network', createdAt: new Date(Date.now() - 86400000 * 20).toISOString() },
    { id: 'ip-3', ip: '172.16.0.0/12', type: 'allow', description: 'VPN range', createdAt: new Date(Date.now() - 86400000 * 10).toISOString() },
  ];
}

function generateTokenPolicies(): TokenPolicy[] {
  return [
    { id: 'tok-1', name: 'Default User Token', expiresIn: 24, maxActive: 5, refreshEnabled: true, updatedAt: new Date(Date.now() - 86400000 * 7).toISOString() },
    { id: 'tok-2', name: 'Admin Token', expiresIn: 8, maxActive: 2, refreshEnabled: true, updatedAt: new Date(Date.now() - 86400000 * 3).toISOString() },
    { id: 'tok-3', name: 'API Service Token', expiresIn: 720, maxActive: 1, refreshEnabled: false, updatedAt: new Date(Date.now() - 86400000 * 14).toISOString() },
  ];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
const AdminSecuritySettingsPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>('policies');
  const [policies, setPolicies] = useState<SecurityPolicy[]>([]);
  const [ipRules, setIPRules] = useState<IPRule[]>([]);
  const [tokenPolicies, setTokenPolicies] = useState<TokenPolicy[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPolicy, setSelectedPolicy] = useState<SecurityPolicy | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<SecurityPolicy['category'] | 'all'>('all');

  useEffect(() => {
    (async () => {
      try {
        const [policiesData, ipData, tokenData] = await Promise.all([
          getSecurityPolicies().catch(() => null),
          fetchIPRules().catch(() => null),
          fetchTokenPolicies().catch(() => null),
        ]);
        setPolicies(
          policiesData && policiesData.length > 0
            ? policiesData.map(p => ({
                id: p.id, name: p.name, category: p.category, enabled: p.enabled,
                description: p.description, config: {} as Record<string, string | number | boolean>,
                updatedAt: p.lastModified,
              }))
            : generatePolicies()
        );
        setIPRules(
          ipData && ipData.length > 0
            ? ipData.map(r => ({ id: r.id, ip: r.address, type: r.type, description: r.description, createdAt: r.createdAt }))
            : generateIPRules()
        );
        setTokenPolicies(
          tokenData && tokenData.length > 0
            ? tokenData.map(tp => ({
                id: tp.id, name: tp.name, expiresIn: tp.maxLifetime,
                maxActive: 5, refreshEnabled: tp.refreshEnabled, updatedAt: new Date().toISOString(),
              }))
            : generateTokenPolicies()
        );
      } catch {
        setPolicies(generatePolicies());
        setIPRules(generateIPRules());
        setTokenPolicies(generateTokenPolicies());
      }
      setLoading(false);
    })();
  }, []);

  const togglePolicy = useCallback((id: string) => {
    setPolicies(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p);
      const target = updated.find(p => p.id === id);
      if (target) toggleSecurityPolicy(id, target.enabled).catch(() => {});
      return updated;
    });
  }, []);

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'policies', label: t('admin.pages.securitySettings.tabs.policies', 'Security Policies'), count: policies.length },
    { id: 'ip_rules', label: t('admin.pages.securitySettings.tabs.ipRules', 'IP Rules'), count: ipRules.length },
    { id: 'tokens', label: t('admin.pages.securitySettings.tabs.tokens', 'Token Policies'), count: tokenPolicies.length },
  ];

  const filteredPolicies = policies.filter(p => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredIPRules = ipRules.filter(r =>
    !search || r.ip.includes(search) || r.description.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTokens = tokenPolicies.filter(tp =>
    !search || tp.name.toLowerCase().includes(search.toLowerCase())
  );

  const enabledCount = policies.filter(p => p.enabled).length;
  const disabledCount = policies.length - enabledCount;

  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {t('admin.pages.securitySettings.title', 'Security Settings')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('admin.pages.securitySettings.description', 'Configure security policies, IP rules, and token management')}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: t('admin.security.totalPolicies', 'Total Policies'), value: policies.length, color: 'text-blue-600' },
            { label: t('admin.security.enabled', 'Enabled'), value: enabledCount, color: 'text-green-600' },
            { label: t('admin.security.disabled', 'Disabled'), value: disabledCount, color: 'text-yellow-600' },
            { label: t('admin.security.ipRules', 'IP Rules'), value: ipRules.length, color: 'text-purple-600' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{loading ? '—' : s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 border-b border-border">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearch(''); }}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs text-muted-foreground">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="w-72">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('common.search', 'Search...')}
            />
          </div>
          {activeTab === 'policies' && (
            <div className="flex gap-2 ml-auto">
              {(['all', 'authentication', 'authorization', 'data', 'network', 'compliance'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
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
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Policies Tab */}
            {activeTab === 'policies' && (
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-left">
                      <th className="px-4 py-3 font-medium text-muted-foreground">{t('common.name', 'Name')}</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">{t('admin.security.category', 'Category')}</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">{t('common.status', 'Status')}</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">{t('common.updatedAt', 'Updated')}</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground w-24">{t('common.actions', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredPolicies.map(p => (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedPolicy(p)}
                            className="text-left hover:text-primary transition-colors"
                          >
                            <span className="font-medium text-foreground">{p.name}</span>
                            <span className="block text-xs text-muted-foreground mt-0.5">{p.description}</span>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground">
                            {CATEGORY_LABELS[p.category]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={p.enabled ? 'success' : 'warning'}>
                            {p.enabled ? t('common.enabled', 'Enabled') : t('common.disabled', 'Disabled')}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(p.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => togglePolicy(p.id)}
                            className={`relative w-10 h-5 rounded-full transition-colors ${
                              p.enabled ? 'bg-green-500' : 'bg-muted-foreground/30'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                p.enabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredPolicies.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          {t('common.noResults', 'No results found')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* IP Rules Tab */}
            {activeTab === 'ip_rules' && (
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-left">
                      <th className="px-4 py-3 font-medium text-muted-foreground">{t('admin.security.ipAddress', 'IP / CIDR')}</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">{t('common.type', 'Type')}</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">{t('common.description', 'Description')}</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">{t('common.createdAt', 'Created')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredIPRules.map(r => (
                      <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-foreground">{r.ip}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={r.type === 'allow' ? 'success' : 'error'}>
                            {r.type === 'allow' ? 'Allow' : 'Block'}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{r.description}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Token Policies Tab */}
            {activeTab === 'tokens' && (
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-left">
                      <th className="px-4 py-3 font-medium text-muted-foreground">{t('common.name', 'Name')}</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">{t('admin.security.expiresIn', 'Expires In')}</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">{t('admin.security.maxActive', 'Max Active')}</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">{t('admin.security.refresh', 'Refresh')}</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">{t('common.updatedAt', 'Updated')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredTokens.map(tp => (
                      <tr key={tp.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{tp.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {tp.expiresIn >= 24 ? `${Math.floor(tp.expiresIn / 24)}d` : `${tp.expiresIn}h`}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{tp.maxActive}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={tp.refreshEnabled ? 'success' : 'warning'}>
                            {tp.refreshEnabled ? 'Yes' : 'No'}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(tp.updatedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Policy Detail Modal */}
        {selectedPolicy && (
          <Modal isOpen onClose={() => setSelectedPolicy(null)} title={selectedPolicy.name}>
            <div className="flex flex-col gap-4 p-4">
              <div>
                <p className="text-xs text-muted-foreground">{t('common.description', 'Description')}</p>
                <p className="text-sm text-foreground mt-1">{selectedPolicy.description}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('admin.security.category', 'Category')}</p>
                <p className="text-sm text-foreground mt-1">{CATEGORY_LABELS[selectedPolicy.category]}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('common.status', 'Status')}</p>
                <StatusBadge status={selectedPolicy.enabled ? 'success' : 'warning'}>
                  {selectedPolicy.enabled ? 'Enabled' : 'Disabled'}
                </StatusBadge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">{t('admin.security.configuration', 'Configuration')}</p>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  {Object.entries(selectedPolicy.config).map(([key, val]) => (
                    <div key={key} className="flex justify-between py-1 text-sm">
                      <span className="text-muted-foreground font-mono">{key}</span>
                      <span className="text-foreground font-mono">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setSelectedPolicy(null)}>
                  {t('common.close', 'Close')}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </ContentArea>
  );
};

const feature: AdminFeatureModule = {
  id: 'admin-security-settings',
  name: 'AdminSecuritySettingsPage',
  adminSection: 'admin-security',
  routes: {
    'admin-security-settings': AdminSecuritySettingsPage,
  },
};

export default feature;
