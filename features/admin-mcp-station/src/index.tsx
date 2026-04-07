'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea, Button, SearchInput, StatusBadge, Modal, StatCard } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import {
  checkMCPHealth,
  listMCPSessions,
  deleteMCPSession,
  getMCPSessionTools,
  createMCPSession,
  authLoginMCPSession,
  authStatusMCPSession,
  authLogoutMCPSession,
  type MCPSession,
  type MCPTool,
  type MCPHealthResponse,
  type MCPAuthStatus,
} from '@xgen/api-client';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface SessionWithTools extends MCPSession {
  tools?: MCPTool[];
  toolsLoading?: boolean;
  toolsExpanded?: boolean;
}

interface DeviceCodeModal {
  sessionId: string;
  deviceCode: string;
  verificationUrl: string;
}

type ViewMode = 'dashboard' | 'create';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const MS365_SERVER_KEYWORD = '@softeria/ms-365-mcp-server';
const HEALTH_CHECK_INTERVAL = 30000;
const AUTH_POLL_INTERVAL = 3000;

const isMS365Session = (session: MCPSession): boolean => {
  return (session.server_args || []).some(arg => arg.includes(MS365_SERVER_KEYWORD));
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
const AdminMcpStationPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();

  // Core state
  const [mcpHealthy, setMcpHealthy] = useState(false);
  const [sessions, setSessions] = useState<SessionWithTools[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Create form
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'python' | 'node'>('python');
  const [formCommand, setFormCommand] = useState('');
  const [formArgs, setFormArgs] = useState('');
  const [formEnv, setFormEnv] = useState<Array<{ key: string; value: string }>>([]);
  const [creating, setCreating] = useState(false);

  // Per-session auth state
  const [authStates, setAuthStates] = useState<Record<string, boolean>>({});
  const [deviceCodeModal, setDeviceCodeModal] = useState<DeviceCodeModal | null>(null);
  const authPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Health check (30s interval) ───────────────────────────
  const doHealthCheck = useCallback(async () => {
    try {
      await checkMCPHealth();
      setMcpHealthy(true);
    } catch {
      setMcpHealthy(false);
    }
  }, []);

  useEffect(() => {
    doHealthCheck();
    const interval = setInterval(doHealthCheck, HEALTH_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [doHealthCheck]);

  // ─── Session loading ───────────────────────────────────────
  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const [healthResp, sessionList] = await Promise.all([
        checkMCPHealth().catch(() => ({ status: 'offline', sessions_count: 0 } as MCPHealthResponse)),
        listMCPSessions().catch(() => [] as MCPSession[]),
      ]);
      setMcpHealthy(healthResp.status === 'ok' || healthResp.status === 'online' || healthResp.status === 'healthy');
      const mapped = sessionList.map((s: MCPSession) => ({
        ...s,
        tools: undefined,
        toolsLoading: false,
        toolsExpanded: false,
      }));
      setSessions(mapped);
      setLastUpdated(new Date());

      // MS365 세션 인증 상태 자동 체크
      const ms365Running = mapped.filter(
        (s: SessionWithTools) => isMS365Session(s) && s.status === 'running'
      );
      for (const session of ms365Running) {
        checkAuthStatus(session.session_id);
      }
    } catch {
      setMcpHealthy(false);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Auth 폴링 클린업
  useEffect(() => {
    return () => {
      if (authPollingRef.current) clearInterval(authPollingRef.current);
    };
  }, []);

  // ─── Auth handling ─────────────────────────────────────────
  const checkAuthStatus = async (sessionId: string) => {
    try {
      const result = await authStatusMCPSession(sessionId);
      setAuthStates((prev: Record<string, boolean>) => ({ ...prev, [sessionId]: !!result.authenticated }));
    } catch {
      setAuthStates((prev: Record<string, boolean>) => ({ ...prev, [sessionId]: false }));
    }
  };

  const handleAuthLogin = useCallback(async (sessionId: string) => {
    try {
      const result = await authLoginMCPSession(sessionId);

      if (result.status === 'already_authenticated') {
        setAuthStates((prev: Record<string, boolean>) => ({ ...prev, [sessionId]: true }));
        return;
      }

      // Device Code 모달 표시
      setDeviceCodeModal({
        sessionId,
        deviceCode: result.device_code || result.user_code || '',
        verificationUrl: result.verification_url || result.verification_uri || 'https://microsoft.com/devicelogin',
      });

      // 인증 완료 폴링 시작
      if (authPollingRef.current) clearInterval(authPollingRef.current);
      authPollingRef.current = setInterval(async () => {
        try {
          const status = await authStatusMCPSession(sessionId);
          if (status.authenticated) {
            setAuthStates((prev: Record<string, boolean>) => ({ ...prev, [sessionId]: true }));
            setDeviceCodeModal(null);
            if (authPollingRef.current) {
              clearInterval(authPollingRef.current);
              authPollingRef.current = null;
            }
          }
        } catch { /* ignore polling errors */ }
      }, AUTH_POLL_INTERVAL);
    } catch {
      alert(t('admin.pages.mcpStation.toast.authFailed', 'Authentication failed'));
    }
  }, [t]);

  const handleAuthLogout = useCallback(async (sessionId: string) => {
    try {
      await authLogoutMCPSession(sessionId);
      setAuthStates((prev: Record<string, boolean>) => ({ ...prev, [sessionId]: false }));
    } catch {
      alert(t('admin.pages.mcpStation.toast.logoutFailed', 'Logout failed'));
    }
  }, [t]);

  const handleCloseDeviceCodeModal = useCallback(() => {
    setDeviceCodeModal(null);
    if (authPollingRef.current) {
      clearInterval(authPollingRef.current);
      authPollingRef.current = null;
    }
  }, []);

  const handleCopyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code);
  }, []);

  // ─── Session CRUD ──────────────────────────────────────────
  const handleDelete = useCallback(async (sessionId: string) => {
    if (!confirm(t('admin.pages.mcpStation.toast.deleteConfirm', 'Delete this session?'))) return;
    setDeleting(sessionId);
    try {
      await deleteMCPSession(sessionId);
      setSessions((prev: SessionWithTools[]) => prev.filter((s: SessionWithTools) => s.session_id !== sessionId));
    } catch { /* ignore */ }
    setDeleting(null);
  }, [t]);

  const handleToggleTools = useCallback(async (sessionId: string) => {
    setSessions((prev: SessionWithTools[]) => prev.map((s: SessionWithTools) => {
      if (s.session_id !== sessionId) return s;
      if (s.toolsExpanded) return { ...s, toolsExpanded: false };
      if (s.tools) return { ...s, toolsExpanded: true };
      return { ...s, toolsLoading: true, toolsExpanded: true };
    }));
    const session = sessions.find((s: SessionWithTools) => s.session_id === sessionId);
    if (session?.tools) return;
    try {
      const response = await getMCPSessionTools(sessionId);
      const tools = Array.isArray(response) ? response : ((response as any)?.tools || []);
      setSessions((prev: SessionWithTools[]) => prev.map((s: SessionWithTools) =>
        s.session_id === sessionId ? { ...s, tools, toolsLoading: false } : s
      ));
    } catch {
      setSessions((prev: SessionWithTools[]) => prev.map((s: SessionWithTools) =>
        s.session_id === sessionId ? { ...s, tools: [], toolsLoading: false } : s
      ));
    }
  }, [sessions]);

  const handleCreate = useCallback(async () => {
    if (!formCommand.trim()) return;
    setCreating(true);
    try {
      const envObj: Record<string, string> = {};
      formEnv.forEach((e: { key: string; value: string }) => { if (e.key.trim()) envObj[e.key.trim()] = e.value; });
      const session = await createMCPSession({
        session_name: formName.trim() || undefined,
        server_type: formType,
        server_command: formCommand.trim(),
        server_args: formArgs.trim() ? formArgs.split(/\s+/) : undefined,
        env_vars: Object.keys(envObj).length > 0 ? envObj : undefined,
      });
      setSessions((prev: SessionWithTools[]) => [{ ...session }, ...prev]);
      setViewMode('dashboard');
      setFormName(''); setFormCommand(''); setFormArgs(''); setFormEnv([]);
    } catch {
      alert(t('admin.mcp.createFailed', 'Failed to create session'));
    } finally {
      setCreating(false);
    }
  }, [formName, formType, formCommand, formArgs, formEnv, t]);

  // ─── Derived state ────────────────────────────────────────
  const filteredSessions = sessions.filter((s: SessionWithTools) =>
    !search ||
    (s.session_name || '').toLowerCase().includes(search.toLowerCase()) ||
    s.session_id.toLowerCase().includes(search.toLowerCase()) ||
    (s.server_command || '').toLowerCase().includes(search.toLowerCase())
  );

  const runningSessions = sessions.filter((s: SessionWithTools) => s.status === 'running').length;

  const formatRelativeTime = (dateString: string) => {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (mins < 1) return t('admin.pages.mcpStation.time.justNow', 'just now');
    if (mins < 60) return t('admin.pages.mcpStation.time.minutesAgo', { count: mins });
    if (hours < 24) return t('admin.pages.mcpStation.time.hoursAgo', { count: hours });
    return t('admin.pages.mcpStation.time.daysAgo', { count: days });
  };

  const getStatusBadge = (status: string): 'success' | 'warning' | 'error' => {
    switch (status.toLowerCase()) {
      case 'running': return 'success';
      case 'starting': return 'warning';
      case 'stopped': case 'error': return 'error';
      default: return 'warning';
    }
  };

  return (
    <ContentArea
      title={t('admin.pages.mcpStation.title', 'MCP Station')}
      description={t('admin.pages.mcpStation.subtitle', 'Manage MCP server sessions and monitor tools')}
      headerActions={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${mcpHealthy ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className={`text-xs font-medium ${mcpHealthy ? 'text-green-600' : 'text-red-600'}`}>
              {mcpHealthy
                ? t('admin.pages.mcpStation.status.connected', 'Connected')
                : t('admin.pages.mcpStation.status.disconnected', 'Disconnected')}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={loadSessions} disabled={loading}>
            {t('common.refresh', 'Refresh')}
          </Button>
          {viewMode === 'dashboard' ? (
            <Button size="sm" onClick={() => setViewMode('create')}>
              {t('admin.mcp.newSession', '+ New Session')}
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setViewMode('dashboard')}>
              {t('common.back', 'Back')}
            </Button>
          )}
        </div>
      }
      toolbar={
        viewMode === 'dashboard' ? (
          <SearchInput value={search} onChange={setSearch} placeholder={t('admin.mcp.searchSessions', 'Search sessions...')} />
        ) : undefined
      }
      subToolbar={
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label={t('admin.pages.mcpStation.stats.totalSessions', 'Total Sessions')}
            value={sessions.length}
            variant="info"
            loading={loading}
          />
          <StatCard
            label={t('admin.pages.mcpStation.stats.running', 'Running')}
            value={runningSessions}
            variant="success"
            loading={loading}
          />
          <StatCard
            label={t('admin.mcp.stoppedSessions', 'Stopped')}
            value={sessions.length - runningSessions}
            variant="warning"
            loading={loading}
          />
          <StatCard
            label={t('admin.pages.mcpStation.stats.lastUpdated', 'Last Updated')}
            value={lastUpdated ? formatRelativeTime(lastUpdated.toISOString()) : '\u2014'}
            variant="neutral"
          />
        </div>
      }
    >

        {/* Create Form */}
        {viewMode === 'create' && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">{t('admin.mcp.createSession', 'Create New Session')}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground">{t('admin.mcp.sessionName', 'Session Name')}</label>
                <input value={formName} onChange={e => setFormName(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary" placeholder="my-mcp-session" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{t('admin.mcp.serverType', 'Server Type')}</label>
                <select value={formType} onChange={e => setFormType(e.target.value as 'python' | 'node')} className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="python">Python</option>
                  <option value="node">Node.js</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{t('admin.mcp.command', 'Command')}</label>
                <input value={formCommand} onChange={e => setFormCommand(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono" placeholder={formType === 'python' ? 'python -m mcp_server' : 'npx mcp-server'} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{t('admin.mcp.arguments', 'Arguments (space separated)')}</label>
                <input value={formArgs} onChange={e => setFormArgs(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono" placeholder="--port 3000 --verbose" />
              </div>
            </div>

            {/* Env vars */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-muted-foreground">{t('admin.mcp.envVars', 'Environment Variables')}</label>
                <Button variant="ghost" size="sm" onClick={() => setFormEnv((prev: Array<{ key: string; value: string }>) => [...prev, { key: '', value: '' }])}>+ Add</Button>
              </div>
              {formEnv.map((env: { key: string; value: string }, idx: number) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input value={env.key} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormEnv((prev: Array<{ key: string; value: string }>) => prev.map((v: { key: string; value: string }, i: number) => i === idx ? { ...v, key: e.target.value } : v))} className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-border bg-background text-foreground font-mono" placeholder="KEY" />
                  <input value={env.value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormEnv((prev: Array<{ key: string; value: string }>) => prev.map((v: { key: string; value: string }, i: number) => i === idx ? { ...v, value: e.target.value } : v))} className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-border bg-background text-foreground font-mono" placeholder="value" />
                  <Button variant="danger" size="icon" onClick={() => setFormEnv((prev: Array<{ key: string; value: string }>) => prev.filter((_: { key: string; value: string }, i: number) => i !== idx))}>&times;</Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-4">
              <Button onClick={handleCreate} disabled={creating || !formCommand.trim()}>
                {creating ? t('admin.mcp.creating', 'Creating...') : t('admin.mcp.create', 'Create Session')}
              </Button>
            </div>
          </div>
        )}

        {/* Session List */}
        {viewMode === 'dashboard' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                {sessions.length === 0
                  ? t('admin.pages.mcpStation.empty.title', 'No active sessions. Create one to get started.')
                  : t('common.noResults', 'No results found')}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSessions.map((session: SessionWithTools) => (
                  <div key={session.session_id} className="rounded-xl border border-border bg-card overflow-hidden">
                    {/* Session header */}
                    <div className="flex items-center gap-4 p-4">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        session.status === 'running' ? 'bg-green-500' :
                        session.status === 'starting' ? 'bg-yellow-500 animate-pulse' :
                        'bg-muted-foreground/40'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground truncate">
                            {session.session_name || t('admin.pages.mcpStation.session.unnamed', 'Unnamed Session')}
                          </span>
                          <StatusBadge status={getStatusBadge(session.status)}>
                            {session.status}
                          </StatusBadge>
                          <span className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground">{session.server_type}</span>
                          {/* MS365 auth badge */}
                          {isMS365Session(session) && (
                            <span className={`px-2 py-0.5 text-xs rounded flex items-center gap-1 ${
                              authStates[session.session_id]
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                            }`}>
                              {authStates[session.session_id]
                                ? t('admin.pages.mcpStation.session.authenticated', 'Authenticated')
                                : t('admin.pages.mcpStation.session.unauthenticated', 'Unauthenticated')}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                          <div><strong>Session ID:</strong> <code className="text-xs">{session.session_id}</code></div>
                          <div><strong>Command:</strong> <code className="text-xs">{session.server_command} {session.server_args?.join(' ') || ''}</code></div>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{session.server_type}</span>
                          <span>{formatRelativeTime(session.created_at)}</span>
                          {session.pid && <span>PID: {session.pid}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" onClick={() => handleToggleTools(session.session_id)}>
                          {t('admin.pages.mcpStation.session.tools', 'Tools')}
                          {session.tools && ` (${session.tools.length})`}
                        </Button>
                        {/* MS365 auth buttons */}
                        {isMS365Session(session) && session.status === 'running' && (
                          authStates[session.session_id] ? (
                            <Button variant="outline" size="sm" onClick={() => handleAuthLogout(session.session_id)}
                              className="text-orange-600 border-orange-200 hover:bg-orange-50">
                              {t('admin.pages.mcpStation.session.logout', 'Logout')}
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => handleAuthLogin(session.session_id)}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50">
                              {t('admin.pages.mcpStation.session.login', 'Login')}
                            </Button>
                          )
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(session.session_id)}
                          disabled={deleting === session.session_id}
                        >
                          {deleting === session.session_id ? '...' : t('common.delete', 'Delete')}
                        </Button>
                      </div>
                    </div>

                    {/* Error message */}
                    {session.error_message && (
                      <div className="border-t border-border bg-red-50 px-4 py-2 flex items-center gap-2 text-sm text-red-700">
                        <span className="font-medium">!</span>
                        {session.error_message}
                      </div>
                    )}

                    {/* Tools expansion */}
                    {session.toolsExpanded && (
                      <div className="border-t border-border bg-muted/20 p-4">
                        {session.toolsLoading ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            {t('admin.pages.mcpStation.session.toolsLoading', 'Loading tools...')}
                          </div>
                        ) : session.tools && session.tools.length > 0 ? (
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                              {t('admin.pages.mcpStation.session.availableTools', { count: session.tools.length })}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {session.tools.map((tool: MCPTool) => (
                                <div key={tool.name} className="rounded-lg border border-border bg-card p-3">
                                  <p className="text-sm font-medium text-foreground font-mono">{tool.name}</p>
                                  {tool.description && (
                                    <p className="text-xs text-muted-foreground mt-1">{tool.description}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">{t('admin.pages.mcpStation.session.noTools', 'No tools available')}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Device Code Modal */}
        {deviceCodeModal && (
          <Modal
            isOpen
            onClose={handleCloseDeviceCodeModal}
            title={t('admin.pages.mcpStation.modal.title', 'Microsoft 365 Authentication')}
          >
            <div className="flex flex-col gap-4 p-4">
              <p className="text-sm text-muted-foreground">
                {t('admin.pages.mcpStation.modal.instruction', 'Enter this code at the verification URL to authenticate:')}
              </p>
              <div className="flex items-center justify-center gap-3 bg-muted rounded-lg p-4">
                <code className="text-2xl font-mono font-bold text-foreground tracking-widest">
                  {deviceCodeModal.deviceCode}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyCode(deviceCodeModal.deviceCode)}
                  title={t('admin.pages.mcpStation.modal.copyCode', 'Copy code')}
                >
                  {t('admin.pages.mcpStation.modal.copyCode', 'Copy')}
                </Button>
              </div>
              <a
                href={deviceCodeModal.verificationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline text-center"
              >
                {deviceCodeModal.verificationUrl} &nearr;
              </a>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                {t('admin.pages.mcpStation.modal.waiting', 'Waiting for authentication...')}
              </div>
              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={handleCloseDeviceCodeModal}>
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
  id: 'admin-mcp-station',
  name: 'AdminMcpStationPage',
  adminSection: 'admin-mcp',
  sidebarItems: [
    { id: 'admin-mcp-station', titleKey: 'admin.sidebar.mcp.mcpStation.title', descriptionKey: 'admin.sidebar.mcp.mcpStation.description' },
  ],
  routes: {
    'admin-mcp-station': AdminMcpStationPage,
  },
};

export default feature;
