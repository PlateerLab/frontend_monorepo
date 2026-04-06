'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Input, Label, Select, SelectTrigger, SelectContent, SelectItem, SelectValue, Textarea, Checkbox, useToast } from '@xgen/ui';
import { FiArrowLeft, FiPlay, FiSave } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { createApiClient } from '@xgen/api-client';
import {
  executeDocQuery,
  createDocJob,
  updateDocJob,
  startDocJob,
  type DocJob,
  type DocScheduleType,
} from './api';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ConnectionOption {
  id: number;
  connectionName: string;
  dbType: string;
  host: string;
  port: number;
  databaseName: string;
  isActive: boolean;
}

interface CollectionOption {
  name: string;
  displayName: string;
}

export interface DocJobEditorProps {
  connections: ConnectionOption[];
  editJob?: DocJob | null;
  preselectedConnectionId?: number;
  onBack: () => void;
  onSaved: () => void;
}

const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export const DocJobEditor: React.FC<DocJobEditorProps> = ({
  connections,
  editJob,
  preselectedConnectionId,
  onBack,
  onSaved,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  // ── Basic Info ──
  const [jobName, setJobName] = useState('');
  const [description, setDescription] = useState('');
  const [connectionId, setConnectionId] = useState<number | ''>('');
  const [targetCollection, setTargetCollection] = useState('');
  const [collections, setCollections] = useState<CollectionOption[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);

  // ── Query ──
  const [query, setQuery] = useState('');
  const [queryRunning, setQueryRunning] = useState(false);
  const [queryResult, setQueryResult] = useState<{
    columns: string[];
    rows: Record<string, unknown>[];
    rowCount: number;
    error?: string;
  } | null>(null);

  // ── Schedule ──
  const [scheduleType, setScheduleType] = useState<DocScheduleType>('once');
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [intervalSeconds, setIntervalSeconds] = useState(3600);
  const [cronExpression, setCronExpression] = useState('0 9 * * *');
  const [weekdays, setWeekdays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxExecutions, setMaxExecutions] = useState('');

  // ── Options ──
  const [autoStart, setAutoStart] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Init from edit job ──
  useEffect(() => {
    if (editJob) {
      setJobName(editJob.jobName);
      setDescription(editJob.description || '');
      setConnectionId(editJob.connectionId);
      setTargetCollection(editJob.targetCollection || '');
      setQuery(editJob.query || '');
      setScheduleType(editJob.scheduleType || 'once');
      const cfg = editJob.scheduleConfig || {};
      setHour(cfg.hour ?? 9);
      setMinute(cfg.minute ?? 0);
      setIntervalSeconds(cfg.interval_seconds ?? 3600);
      setCronExpression(cfg.cron_expression ?? '0 9 * * *');
      setWeekdays(cfg.weekdays ?? [0, 1, 2, 3, 4]);
      setStartTime(cfg.start_time ?? '');
      setEndTime(cfg.end_time ?? '');
      setMaxExecutions(cfg.max_executions != null ? String(cfg.max_executions) : '');
    } else if (preselectedConnectionId) {
      setConnectionId(preselectedConnectionId);
    }
  }, [editJob, preselectedConnectionId]);

  // ── Load collections ──
  useEffect(() => {
    const load = async () => {
      setCollectionsLoading(true);
      try {
        const api = createApiClient();
        const response = await api.get<any>('/api/retrieval/collections');
        const raw = Array.isArray(response.data)
          ? response.data
          : response.data?.collections || [];
        setCollections(
          raw.map((c: any) => ({
            name: c.collection_name,
            displayName: c.collection_make_name || c.display_name || c.collection_name,
          })),
        );
      } catch {
        setCollections([]);
      } finally {
        setCollectionsLoading(false);
      }
    };
    load();
  }, []);

  // ── Run Query ──
  const handleRunQuery = useCallback(async () => {
    if (!connectionId || !query.trim()) return;
    setQueryRunning(true);
    setQueryResult(null);
    try {
      const result = await executeDocQuery(connectionId as number, query.trim(), 100);
      setQueryResult(result);
      if (!result.error) {
        toast.success(t('documents.dbDocumentation.editor.resultCount', { count: String(result.rowCount) }));
      }
    } catch (err: any) {
      setQueryResult({ columns: [], rows: [], rowCount: 0, error: err.message });
      toast.error(err.message || t('documents.dbDocumentation.editor.queryError'));
    } finally {
      setQueryRunning(false);
    }
  }, [connectionId, query, toast, t]);

  // ── Save ──
  const handleSave = useCallback(async () => {
    if (!jobName.trim()) { toast.error(t('documents.dbDocumentation.editor.nameRequired')); return; }
    if (!connectionId) { toast.error(t('documents.dbDocumentation.editor.connectionRequired')); return; }
    if (!query.trim()) { toast.error(t('documents.dbDocumentation.editor.queryRequired')); return; }
    if (!targetCollection.trim()) { toast.error(t('documents.dbDocumentation.editor.collectionRequired')); return; }

    const conn = connections.find(c => c.id === (connectionId as number));

    const payload: Record<string, unknown> = {
      connection_id: connectionId,
      connection_name: conn?.connectionName || '',
      job_name: jobName.trim(),
      description: description.trim() || undefined,
      query: query.trim(),
      target_collection: targetCollection.trim(),
      schedule_type: scheduleType,
      schedule_config: {
        hour,
        minute,
        interval_seconds: intervalSeconds,
        cron_expression: cronExpression,
        weekdays,
        start_time: startTime || undefined,
        end_time: endTime || undefined,
        max_executions: maxExecutions ? Number(maxExecutions) : undefined,
      },
    };

    setSaving(true);
    try {
      let saved: DocJob;
      if (editJob?.id) {
        saved = await updateDocJob(editJob.id, payload);
      } else {
        saved = await createDocJob(payload);
      }
      if (autoStart && saved.id) {
        try { await startDocJob(saved.id); } catch { /* ignore start failure */ }
      }
      toast.success(t('documents.dbDocumentation.editor.saved'));
      onSaved();
    } catch (err: any) {
      toast.error(err.message || t('documents.dbDocumentation.editor.saveError'));
    } finally {
      setSaving(false);
    }
  }, [jobName, connectionId, query, targetCollection, description, scheduleType, hour, minute, intervalSeconds, cronExpression, weekdays, startTime, endTime, maxExecutions, autoStart, editJob, connections, onSaved, toast, t]);

  // ── Weekday toggle ──
  const toggleWeekday = (day: number) => {
    setWeekdays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort());
  };

  const activeConnections = connections.filter(c => c.isActive);
  const canSave = !!jobName.trim() && !!connectionId && !!query.trim() && !!targetCollection.trim();

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--color-line-50)]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            title={t('documents.dbDocumentation.editor.back')}
          >
            <FiArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-sm font-semibold text-foreground">
            {editJob ? t('documents.dbDocumentation.editor.editTitle') : t('documents.dbDocumentation.editor.createTitle')}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBack} disabled={saving}>
            {t('documents.dbDocumentation.editor.cancel')}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !canSave}>
            <FiSave className="w-3.5 h-3.5" />
            {saving ? t('documents.dbDocumentation.editor.saving') : t('documents.dbDocumentation.editor.save')}
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Section 1: Basic Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">{t('documents.dbDocumentation.editor.basicInfo')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('documents.dbDocumentation.editor.jobName')} *</Label>
              <Input value={jobName} onChange={e => setJobName(e.target.value)} placeholder={t('documents.dbDocumentation.editor.jobNamePlaceholder')} />
            </div>
            <div className="space-y-2">
              <Label>{t('documents.dbDocumentation.editor.targetCollection')} *</Label>
              <Select value={targetCollection} onValueChange={setTargetCollection} disabled={collectionsLoading}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={collectionsLoading ? t('documents.dbDocumentation.editor.loadingCollections') : t('documents.dbDocumentation.editor.selectCollectionPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {collections.map(col => (
                    <SelectItem key={col.name} value={col.name}>{col.displayName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('documents.dbDocumentation.editor.description')}</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder={t('documents.dbDocumentation.editor.descriptionPlaceholder')} />
          </div>
        </div>

        {/* Section 2: DB Connection & Query */}
        <div className="border-t pt-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">{t('documents.dbDocumentation.editor.querySection')}</h3>
          <div className="space-y-2">
            <Label>{t('documents.dbDocumentation.editor.selectConnection')} *</Label>
            <Select
              value={connectionId ? String(connectionId) : ''}
              onValueChange={v => setConnectionId(v ? Number(v) : '')}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('documents.dbDocumentation.editor.selectConnectionPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {activeConnections.map(conn => (
                  <SelectItem key={conn.id} value={String(conn.id)}>
                    {conn.connectionName} ({conn.dbType.toUpperCase()} · {conn.host}:{conn.port}/{conn.databaseName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('documents.dbDocumentation.editor.query')} *</Label>
            <Textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t('documents.dbDocumentation.editor.queryPlaceholder')}
              rows={6}
              className="font-mono text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleRunQuery} disabled={queryRunning || !connectionId || !query.trim()}>
              <FiPlay className="w-3.5 h-3.5" />
              {queryRunning ? t('documents.dbDocumentation.editor.running') : t('documents.dbDocumentation.editor.runQuery')}
            </Button>
            {queryResult && !queryResult.error && (
              <span className="text-xs text-muted-foreground">
                {t('documents.dbDocumentation.editor.resultCount', { count: String(queryResult.rowCount) })}
              </span>
            )}
          </div>

          {/* Query Results */}
          {queryResult && (
            <div className="mt-3">
              {queryResult.error ? (
                <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{queryResult.error}</div>
              ) : queryResult.rows.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 text-xs text-muted-foreground">
                    <span>{t('documents.dbDocumentation.editor.queryResult')}</span>
                    <span>{queryResult.rowCount} {t('documents.dbDocumentation.editor.rows')}</span>
                  </div>
                  <div className="overflow-x-auto max-h-64">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-gray-50/50">
                          {queryResult.columns.map(col => (
                            <th key={col} className="px-3 py-1.5 text-left font-medium text-muted-foreground whitespace-nowrap">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResult.rows.slice(0, 100).map((row, i) => (
                          <tr key={i} className="border-b last:border-0 hover:bg-gray-50/50">
                            {queryResult.columns.map(col => (
                              <td key={col} className="px-3 py-1.5 whitespace-nowrap max-w-[200px] truncate">
                                {row[col] != null ? String(row[col]) : <span className="text-muted-foreground">NULL</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">{t('documents.dbDocumentation.editor.noResults')}</div>
              )}
            </div>
          )}
        </div>

        {/* Section 3: Schedule */}
        <div className="border-t pt-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">{t('documents.dbDocumentation.editor.scheduleSection')}</h3>
          <div className="space-y-2">
            <Label>{t('documents.dbDocumentation.editor.scheduleType')}</Label>
            <Select value={scheduleType} onValueChange={v => setScheduleType(v as DocScheduleType)}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once">{t('documents.dbDocumentation.scheduleType.once')}</SelectItem>
                <SelectItem value="interval">{t('documents.dbDocumentation.scheduleType.interval')}</SelectItem>
                <SelectItem value="daily">{t('documents.dbDocumentation.scheduleType.daily')}</SelectItem>
                <SelectItem value="weekly">{t('documents.dbDocumentation.scheduleType.weekly')}</SelectItem>
                <SelectItem value="cron">{t('documents.dbDocumentation.scheduleType.cron')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* once: start time */}
          {scheduleType === 'once' && (
            <div className="space-y-2">
              <Label>{t('documents.dbDocumentation.editor.startTime')}</Label>
              <Input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="max-w-xs" />
            </div>
          )}

          {/* interval: seconds */}
          {scheduleType === 'interval' && (
            <div className="space-y-2">
              <Label>{t('documents.dbDocumentation.editor.intervalSeconds')}</Label>
              <Input type="number" value={intervalSeconds} onChange={e => setIntervalSeconds(Math.max(60, Number(e.target.value)))} min={60} className="max-w-xs" />
            </div>
          )}

          {/* daily/weekly: hour + minute */}
          {(scheduleType === 'daily' || scheduleType === 'weekly') && (
            <div className="grid grid-cols-2 gap-3 max-w-xs">
              <div className="space-y-2">
                <Label>{t('documents.dbDocumentation.editor.hour')}</Label>
                <Input type="number" value={hour} onChange={e => setHour(Math.min(23, Math.max(0, Number(e.target.value))))} min={0} max={23} />
              </div>
              <div className="space-y-2">
                <Label>{t('documents.dbDocumentation.editor.minute')}</Label>
                <Input type="number" value={minute} onChange={e => setMinute(Math.min(59, Math.max(0, Number(e.target.value))))} min={0} max={59} />
              </div>
            </div>
          )}

          {/* weekly: weekday buttons */}
          {scheduleType === 'weekly' && (
            <div className="space-y-2">
              <Label>{t('documents.dbDocumentation.editor.weekdays')}</Label>
              <div className="flex gap-1.5">
                {WEEKDAY_LABELS.map((label, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleWeekday(idx)}
                    className={`w-9 h-9 rounded-lg text-xs font-medium border transition-colors ${
                      weekdays.includes(idx)
                        ? 'bg-blue-50 border-blue-400 text-blue-600'
                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* cron: expression */}
          {scheduleType === 'cron' && (
            <div className="space-y-2">
              <Label>{t('documents.dbDocumentation.editor.cronExpression')}</Label>
              <Input value={cronExpression} onChange={e => setCronExpression(e.target.value)} placeholder="0 9 * * *" className="max-w-xs font-mono" />
            </div>
          )}

          {/* End conditions */}
          <div className="grid grid-cols-2 gap-3 max-w-md pt-2">
            <div className="space-y-2">
              <Label>{t('documents.dbDocumentation.editor.endTime')}</Label>
              <Input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('documents.dbDocumentation.editor.maxExecutions')}</Label>
              <Input type="number" value={maxExecutions} onChange={e => setMaxExecutions(e.target.value)} min={1} placeholder={t('documents.dbDocumentation.editor.unlimited')} />
            </div>
          </div>
        </div>

        {/* Section 4: Advanced */}
        <div className="border-t pt-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">{t('documents.dbDocumentation.editor.advancedOptions')}</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={autoStart} onChange={(v: boolean) => setAutoStart(v)} />
            <span className="text-sm">{t('documents.dbDocumentation.editor.autoStart')}</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default DocJobEditor;
