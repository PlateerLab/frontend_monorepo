'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, StatusBadge } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import {
  createPythonMCPSession,
  createNodeMCPSession,
  getMCPSessionTools,
  listMCPSessions,
  deleteMCPSession,
  type MCPItem,
  type MCPSession,
} from '@xgen/api-client';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface MCPDetailSectionProps {
  item: MCPItem;
  onBack: () => void;
}

interface EnvVarEntry {
  id: string;
  key: string;
  value: string;
  isFromTemplate: boolean;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const MS365_SERVER_KEYWORD = '@softeria/ms-365-mcp-server';

const MS365_PRESET_VALUES = [
  'all', 'mail', 'calendar', 'work', 'files',
  'personal', 'excel', 'contacts', 'tasks', 'onenote', 'search', 'users',
] as const;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
const MCPDetailSection: React.FC<MCPDetailSectionProps> = ({ item, onBack }) => {
  const { t } = useTranslation();

  const isMS365 = (item.serverArgs || []).some((arg: string) => arg.includes(MS365_SERVER_KEYWORD));

  const MS365_PRESETS = useMemo(() => MS365_PRESET_VALUES.map(value => ({
    value,
    label: t(`admin.pages.mcpMarket.detail.ms365Presets.${value}`, value),
  })), [t]);

  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('all');
  const [activeSessions, setActiveSessions] = useState<MCPSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [envVarEntries, setEnvVarEntries] = useState<EnvVarEntry[]>(() => {
    if (item.envVars && Object.keys(item.envVars).length > 0) {
      return Object.entries(item.envVars).map(([key, value], index) => ({
        id: `env-${index}`,
        key,
        value: typeof value === 'string' ? value : '',
        isFromTemplate: true,
      }));
    }
    return [];
  });

  const getStatusText = (status: string): string => {
    const map: Record<string, string> = {
      '우수': t('admin.pages.mcpMarket.card.status.excellent', 'Excellent'),
      '양호': t('admin.pages.mcpMarket.card.status.good', 'Good'),
      '보통': t('admin.pages.mcpMarket.card.status.normal', 'Normal'),
      '일반': t('admin.pages.mcpMarket.card.status.normal', 'Normal'),
    };
    return map[status] || status;
  };

  // 관련 세션 로드
  const loadSessions = useCallback(async () => {
    try {
      setIsLoadingSessions(true);
      const sessions = await listMCPSessions();
      const related = sessions.filter((s: MCPSession) => {
        const name = s.session_name || '';
        return name === item.name || name.startsWith(`${item.name} (`);
      });
      setActiveSessions(related);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [item.name]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // 환경 변수 관리
  const handleAddEnvVar = () => {
    setEnvVarEntries((prev: EnvVarEntry[]) => [...prev, {
      id: `env-${Date.now()}`,
      key: '',
      value: '',
      isFromTemplate: false,
    }]);
  };

  const handleRemoveEnvVar = (id: string) => {
    setEnvVarEntries((prev: EnvVarEntry[]) => prev.filter((e: EnvVarEntry) => e.id !== id));
  };

  const handleEnvVarChange = (id: string, field: 'key' | 'value', val: string) => {
    setEnvVarEntries((prev: EnvVarEntry[]) => prev.map((e: EnvVarEntry) =>
      e.id === id ? { ...e, [field]: val } : e
    ));
  };

  // 세션 생성
  const handleCreateSession = async () => {
    try {
      setIsCreatingSession(true);

      const serverType = item.serverType || 'node';
      const serverCommand = item.serverCommand || 'npx';
      const serverArgs = [...(item.serverArgs || [])];
      const workingDir = item.workingDir ?? undefined;
      const additionalCommands = item.additionalCommands ?? undefined;

      // MS365 프리셋 주입
      if (isMS365 && selectedPreset && selectedPreset !== 'all') {
        serverArgs.push('--preset', selectedPreset);
      }

      // 세션 이름
      const sessionName = isMS365 && selectedPreset !== 'all'
        ? `${item.name} (${MS365_PRESETS.find((p: { value: string; label: string }) => p.value === selectedPreset)?.label || selectedPreset})`
        : item.name;

      // 환경 변수 변환
      const envVars: Record<string, string> = {};
      const invalidEntries: string[] = [];

      envVarEntries.forEach((entry: EnvVarEntry) => {
        if (!entry.key.trim()) {
          invalidEntries.push(entry.key || 'empty');
          return;
        }
        if (entry.isFromTemplate && (!entry.value || (entry.value.startsWith('<') && entry.value.endsWith('>')))) {
          invalidEntries.push(entry.key);
          return;
        }
        envVars[entry.key] = entry.value;
      });

      if (invalidEntries.length > 0) {
        alert(t('admin.pages.mcpMarket.detail.toast.envVarsRequired', { vars: invalidEntries.join(', ') }));
        return;
      }

      let session: MCPSession;
      if (serverType === 'python') {
        session = await createPythonMCPSession(serverCommand, serverArgs, envVars, workingDir, sessionName, additionalCommands);
      } else {
        session = await createNodeMCPSession(serverCommand, serverArgs, envVars, workingDir, sessionName, additionalCommands);
      }

      // 도구 목록 조회
      try {
        const tools = await getMCPSessionTools(session.session_id);
        const toolCount = Array.isArray(tools) ? tools.length : ((tools as any)?.tools?.length ?? 0);
        alert(t('admin.pages.mcpMarket.detail.toast.sessionCreated', { sessionId: session.session_id }) +
          `\n${t('admin.pages.mcpMarket.detail.toast.toolsFound', { count: toolCount })}`);
      } catch {
        alert(t('admin.pages.mcpMarket.detail.toast.sessionCreated', { sessionId: session.session_id }));
      }

      await loadSessions();
    } catch (err) {
      console.error('Failed to create MCP session:', err);
      alert(t('admin.pages.mcpMarket.detail.toast.sessionCreateFailed', 'Failed to create session'));
    } finally {
      setIsCreatingSession(false);
    }
  };

  // 세션 삭제
  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm(t('admin.pages.mcpMarket.detail.toast.deleteConfirm', 'Delete this session?'))) return;
    try {
      await deleteMCPSession(sessionId);
      await loadSessions();
    } catch (err) {
      console.error('Failed to delete session:', err);
      alert(t('admin.pages.mcpMarket.detail.toast.sessionDeleteFailed', 'Failed to delete session'));
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (mins < 1) return t('admin.pages.mcpMarket.detail.time.justNow', 'just now');
    if (mins < 60) return t('admin.pages.mcpMarket.detail.time.minutesAgo', { count: mins });
    if (hours < 24) return t('admin.pages.mcpMarket.detail.time.hoursAgo', { count: hours });
    return t('admin.pages.mcpMarket.detail.time.daysAgo', { count: days });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-primary hover:underline w-fit">
        <span>&larr;</span>
        <span>{t('admin.pages.mcpMarket.detail.backToList', 'Back to list')}</span>
      </button>

      {/* Item info card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-xl font-bold text-primary overflow-hidden flex-shrink-0">
            {item.iconUrl ? (
              <img src={item.iconUrl} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              item.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground">{item.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{item.author}</p>
            <p className="text-sm text-muted-foreground mt-2">{item.description}</p>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span>{item.downloads.toLocaleString()} {t('admin.pages.mcpMarket.detail.downloads', 'downloads')}</span>
              <span>{item.stars.toLocaleString()} {t('admin.pages.mcpMarket.detail.stars', 'stars')}</span>
              {item.version && <span>v{item.version}</span>}
              <span>{formatDate(item.lastUpdated)}</span>
              {item.language && <span>{item.language}</span>}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              {item.status && (
                <StatusBadge status={item.status === '우수' ? 'success' : item.status === '양호' ? 'warning' : 'info'}>
                  {getStatusText(item.status)}
                </StatusBadge>
              )}
              <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground border border-border">
                {item.category}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Environment variables */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">
            {t('admin.pages.mcpMarket.detail.envVars.title', 'Environment Variables')}
          </h2>
          <button onClick={handleAddEnvVar} className="text-xs text-primary hover:underline">
            + {t('admin.pages.mcpMarket.detail.envVars.add', 'Add')}
          </button>
        </div>
        {item.envVars && Object.keys(item.envVars).length > 0 && (
          <p className="text-xs text-muted-foreground mb-3">
            {t('admin.pages.mcpMarket.detail.envVars.description', 'Set required environment variables before creating a session')}
          </p>
        )}
        {envVarEntries.length > 0 ? (
          <div className="space-y-2">
            {envVarEntries.map((entry: EnvVarEntry) => (
              <div key={entry.id} className="flex gap-2">
                <input
                  type="text"
                  value={entry.key}
                  onChange={e => handleEnvVarChange(entry.id, 'key', e.target.value)}
                  disabled={entry.isFromTemplate}
                  className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-border bg-background text-foreground font-mono disabled:opacity-60"
                  placeholder="KEY"
                />
                <input
                  type="text"
                  value={entry.value}
                  onChange={e => handleEnvVarChange(entry.id, 'value', e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-border bg-background text-foreground font-mono"
                  placeholder={t('admin.pages.mcpMarket.detail.envVars.valuePlaceholder', 'Value')}
                />
                <div className="flex items-center gap-1 flex-shrink-0">
                  {entry.isFromTemplate && (
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-yellow-100 text-yellow-700 border border-yellow-200">
                      {t('admin.pages.mcpMarket.detail.envVars.required', 'Required')}
                    </span>
                  )}
                  {!entry.isFromTemplate && (
                    <button
                      onClick={() => handleRemoveEnvVar(entry.id)}
                      className="px-2 text-sm text-red-500 hover:text-red-700"
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">{t('admin.pages.mcpMarket.detail.envVars.empty', 'No environment variables configured')}</p>
            <p className="text-xs mt-1">{t('admin.pages.mcpMarket.detail.envVars.emptyHint', 'Click "+ Add" to add custom variables')}</p>
          </div>
        )}
      </div>

      {/* MS365 Preset */}
      {isMS365 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold text-foreground mb-2">
            {t('admin.pages.mcpMarket.detail.preset.title', 'MS365 Feature Preset')}
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            {t('admin.pages.mcpMarket.detail.preset.description', 'Select which MS365 features to enable')}
          </p>
          <select
            value={selectedPreset}
            onChange={e => setSelectedPreset(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {MS365_PRESETS.map((preset: { value: string; label: string }) => (
              <option key={preset.value} value={preset.value}>{preset.label}</option>
            ))}
          </select>
          {selectedPreset !== 'all' && (
            <p className="text-xs text-muted-foreground mt-2">
              {t('admin.pages.mcpMarket.detail.preset.optionAdded', { preset: selectedPreset })}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button onClick={handleCreateSession} disabled={isCreatingSession}>
          {isCreatingSession
            ? t('admin.pages.mcpMarket.detail.actions.creating', 'Creating...')
            : t('admin.pages.mcpMarket.detail.actions.runSession', 'Run Session')}
        </Button>
        {item.repository && (
          <a href={item.repository} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors">
            {t('admin.pages.mcpMarket.detail.actions.sourceCode', 'Source Code')}
            <span className="text-xs">&nearr;</span>
          </a>
        )}
        {item.documentation && (
          <a href={item.documentation} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors">
            {t('admin.pages.mcpMarket.detail.actions.documentation', 'Documentation')}
            <span className="text-xs">&nearr;</span>
          </a>
        )}
      </div>

      {/* Features list */}
      {item.features && item.features.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            {t('admin.pages.mcpMarket.detail.features.title', 'Features')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {item.features.map((f: string, i: number) => (
              <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-muted text-muted-foreground border border-border">
                <span className="text-green-500">&#10003;</span>
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Active sessions */}
      {activeSessions.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">
              {t('admin.pages.mcpMarket.detail.activeSessions.title', 'Active Sessions')} ({activeSessions.length})
            </h2>
            <Button variant="outline" size="sm" onClick={loadSessions} disabled={isLoadingSessions}>
              {t('admin.pages.mcpMarket.detail.activeSessions.refresh', 'Refresh')}
            </Button>
          </div>
          <div className="space-y-3">
            {activeSessions.map((session: MCPSession) => (
              <div key={session.session_id} className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">
                        {session.session_name || t('admin.pages.mcpMarket.detail.activeSessions.unnamed', 'Unnamed')}
                      </span>
                      <StatusBadge status={session.status === 'running' ? 'success' : 'warning'}>
                        {session.status}
                      </StatusBadge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                      <div><strong>Session ID:</strong> <code className="text-xs">{session.session_id}</code></div>
                      <div><strong>Command:</strong> <code className="text-xs">{session.server_command} {session.server_args?.join(' ')}</code></div>
                      <div className="flex gap-3">
                        <span>{session.server_type}</span>
                        <span>{formatRelativeTime(session.created_at)}</span>
                        {session.pid && <span>PID: {session.pid}</span>}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteSession(session.session_id)}
                    className="text-red-500 border-red-200 hover:bg-red-50 flex-shrink-0"
                  >
                    {t('admin.pages.mcpMarket.detail.activeSessions.delete', 'Delete')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Install info */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">
          {t('admin.pages.mcpMarket.detail.installInfo.title', 'Server Configuration')}
        </h2>
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm font-mono space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('admin.pages.mcpMarket.detail.installInfo.serverType', 'Server Type')}</span>
            <span className="text-foreground">{item.serverType || 'node'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('admin.pages.mcpMarket.detail.installInfo.command', 'Command')}</span>
            <span className="text-foreground">{item.serverCommand || 'npx'}</span>
          </div>
          {item.serverArgs && item.serverArgs.length > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('admin.pages.mcpMarket.detail.installInfo.args', 'Arguments')}</span>
              <span className="text-foreground">{item.serverArgs.join(' ')}</span>
            </div>
          )}
          {item.additionalCommands && item.additionalCommands.length > 0 && (
            <div>
              <span className="text-muted-foreground">{t('admin.pages.mcpMarket.detail.installInfo.additionalCommands', 'Additional Commands')}</span>
              <div className="mt-1 space-y-1">
                {item.additionalCommands.map((cmd: string, i: number) => (
                  <code key={i} className="block text-xs text-foreground bg-muted rounded px-2 py-1">{cmd}</code>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MCPDetailSection;
