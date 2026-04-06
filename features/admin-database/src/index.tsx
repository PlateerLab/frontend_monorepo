'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea, Button, useToast } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { FiDatabase, FiRefreshCw } from '@xgen/icons';
import {
  getDatabaseInfo,
  checkDatabaseConnection,
  getTableList,
  getTableSampleData,
  executeQuery,
} from '@xgen/api-client';
import type { DatabaseInfo, TableInfo, QueryResult } from '@xgen/api-client';

const i18n = 'admin.pages.database';

const AdminDatabasePage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [queryText, setQueryText] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [sortCol, setSortCol] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [expandedCell, setExpandedCell] = useState<{ row: number; col: string } | null>(null);

  // ── Load database info + tables ──
  const loadDatabaseData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Check connection
      const connected = await checkDatabaseConnection();
      setIsConnected(connected);

      if (!connected) {
        setError(t(`${i18n}.connectionError`, 'Database connection failed'));
        return;
      }

      // 2. Load DB info
      try {
        const infoRes = await getDatabaseInfo();
        if (infoRes.success && infoRes.database_info) {
          setDbInfo(infoRes.database_info);
        }
      } catch {
        // Non-critical — proceed without DB info
      }

      // 3. Load table list
      const tableList = await getTableList();
      setTables(tableList);
    } catch (err) {
      const message = err instanceof Error ? err.message : t(`${i18n}.loadError`, 'Failed to load database data');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadDatabaseData();
  }, [loadDatabaseData]);

  // ── Select table → load sample data ──
  const handleSelectTable = useCallback(async (tableName: string) => {
    setSelectedTable(tableName);
    setQueryText(`SELECT * FROM ${tableName} LIMIT 100`);
    setQueryLoading(true);
    try {
      const data = await getTableSampleData(tableName, 100);
      if (data.success) {
        setResult(data);
        toast.success(t(`${i18n}.toast.tableLoadSuccess`, { tableName }));
      } else {
        setResult({ success: false, data: [], row_count: 0, error: data.error });
        toast.error(t(`${i18n}.toast.tableLoadFailed`, { error: data.error }));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t(`${i18n}.tableLoadError`, 'Failed to load table data');
      setResult({ success: false, data: [], row_count: 0, error: message });
      toast.error(t(`${i18n}.toast.tableLoadFailed`, { error: message }));
    } finally {
      setQueryLoading(false);
    }
  }, [t, toast]);

  // ── Execute query ──
  const handleExecuteQuery = useCallback(async () => {
    if (!queryText.trim()) {
      toast.error(t(`${i18n}.queryRequired`, 'Please enter a query'));
      return;
    }
    setQueryLoading(true);
    try {
      const data = await executeQuery(queryText.trim());
      setResult(data);
      if (data.success) {
        toast.success(t(`${i18n}.toast.querySuccess`, { count: data.row_count }));
      } else {
        toast.error(t(`${i18n}.toast.queryFailed`, { error: data.error }));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t(`${i18n}.queryError`, 'Query execution failed');
      setResult({ success: false, data: [], row_count: 0, error: message });
      toast.error(t(`${i18n}.toast.queryFailed`, { error: message }));
    } finally {
      setQueryLoading(false);
    }
  }, [queryText, t, toast]);

  // ── Refresh ──
  const handleRefresh = useCallback(() => {
    setSelectedTable('');
    setQueryText('');
    setResult(null);
    loadDatabaseData();
  }, [loadDatabaseData]);

  // ── Sort ──
  const handleSort = useCallback((col: string) => {
    setSortCol((prev) => {
      if (prev === col) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return col;
      }
      setSortDir('asc');
      return col;
    });
  }, []);

  // ── Render cell value (20 char limit like xgen) ──
  const renderCellValue = useCallback((value: unknown, rowIdx: number, col: string) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">NULL</span>;
    }
    const str = String(value);
    if (str.length <= 20) return str;
    return (
      <div className="flex items-center gap-1">
        <span>{str.substring(0, 20)}</span>
        <button
          type="button"
          className="text-primary hover:text-primary/80 text-xs font-medium"
          onClick={(e) => {
            e.stopPropagation();
            setExpandedCell({ row: rowIdx, col });
          }}
        >
          ...
        </button>
      </div>
    );
  }, []);

  const columns = useMemo(() => {
    if (!result?.data?.length) return [];
    return Object.keys(result.data[0]);
  }, [result]);

  const sortedData = useMemo(() => {
    if (!result?.data) return [];
    if (!sortCol) return result.data;
    return [...result.data].sort((a, b) => {
      const va = a[sortCol];
      const vb = b[sortCol];
      if (va === undefined || va === null) {
        if (vb === undefined || vb === null) return 0;
        return 1;
      }
      if (vb === undefined || vb === null) return -1;
      if (va === vb) return 0;
      const cmp = va < vb ? -1 : 1;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [result, sortCol, sortDir]);

  // ── Error state ──
  if (error && tables.length === 0) {
    return (
      <ContentArea
        title={t(`${i18n}.title`, 'Database')}
        description={t(`${i18n}.description`, 'Manage databases.')}
      >
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <h3 className="text-base font-semibold text-destructive">
            {t(`${i18n}.errorOccurred`, 'Error')}
          </h3>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="primary" onClick={handleRefresh}>
            <FiRefreshCw className="mr-1.5 h-4 w-4" />
            {t(`${i18n}.retry`, 'Retry')}
          </Button>
        </div>
      </ContentArea>
    );
  }

  // ── Loading state ──
  if (loading) {
    return (
      <ContentArea
        title={t(`${i18n}.title`, 'Database')}
        description={t(`${i18n}.description`, 'Manage databases.')}
      >
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">{t(`${i18n}.loading`, 'Loading...')}</p>
          </div>
        </div>
      </ContentArea>
    );
  }

  return (
    <ContentArea
      title={t(`${i18n}.title`, 'Database')}
      description={t(`${i18n}.description`, 'Manage databases.')}
      headerActions={
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={loading}
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      }
      subToolbar={
        dbInfo ? (
          <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card">
            <FiDatabase className="w-5 h-5 text-primary" />
            <div className="flex items-center gap-6 text-sm">
              <span>
                <span className="text-muted-foreground">
                  {t(`${i18n}.infoBar.status`, 'Status')}{': '}
                </span>
                <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                  {isConnected
                    ? t(`${i18n}.connected`, 'Connected')
                    : t(`${i18n}.disconnected`, 'Disconnected')}
                </span>
              </span>
              {dbInfo.database_type && (
                <span>
                  <span className="text-muted-foreground">
                    {t(`${i18n}.infoBar.database`, 'Database')}{': '}
                  </span>
                  {dbInfo.database_type}
                </span>
              )}
              {dbInfo.version && (
                <span>
                  <span className="text-muted-foreground">
                    {t(`${i18n}.infoBar.version`, 'Version')}{': '}
                  </span>
                  {dbInfo.version}
                </span>
              )}
              <span>
                <span className="text-muted-foreground">
                  {t(`${i18n}.infoBar.tableCount`, 'Tables')}{': '}
                </span>
                {tables.length}
              </span>
            </div>
          </div>
        ) : undefined
      }
    >
      <div className="grid grid-cols-[260px_minmax(0,1fr)] gap-6 max-lg:grid-cols-1">
        {/* Table List */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {t(`${i18n}.sidebar.tableList`, 'Tables')}
            </h2>
            <span className="text-xs text-muted-foreground">
              {t(`${i18n}.sidebar.count`, { count: tables.length })}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 max-h-[500px] overflow-auto rounded-lg border border-border">
            {tables.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground text-center">
                {t(`${i18n}.sidebar.noTables`, 'No tables')}
              </p>
            ) : (
              tables.map((table) => (
                <button
                  key={table.name}
                  type="button"
                  onClick={() => handleSelectTable(table.name)}
                  className={`flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-muted/50 transition-colors ${
                    selectedTable === table.name ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'
                  }`}
                >
                  <span className="truncate">{table.name}</span>
                  {table.row_count !== undefined && (
                    <span className="text-xs text-muted-foreground ml-2">
                      {t(`${i18n}.sidebar.rows`, { count: table.row_count.toLocaleString() })}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Query + Results */}
        <div className="flex flex-col gap-4 min-w-0">
          {/* Query Editor */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">
              {t(`${i18n}.query.label`, 'SQL Query')}
            </label>
            <textarea
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleExecuteQuery();
              }}
              rows={6}
              className="w-full px-3 py-2 text-sm font-mono border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder={t(`${i18n}.query.placeholder`, 'SELECT * FROM ...')}
            />
            <div className="flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={handleExecuteQuery}
                disabled={queryLoading || !queryText.trim()}
              >
                {queryLoading
                  ? t(`${i18n}.query.executing`, 'Executing...')
                  : t(`${i18n}.query.execute`, 'Execute')}
              </Button>
            </div>
          </div>

          {/* Query Loading */}
          {queryLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">
                  {t(`${i18n}.query.running`, 'Running query...')}
                </p>
              </div>
            </div>
          )}

          {/* Query Error */}
          {!queryLoading && result && !result.success && result.error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
              <h4 className="text-sm font-semibold text-destructive mb-1">
                {t(`${i18n}.result.error`, 'Error')}
              </h4>
              <p className="text-sm text-destructive/80">{result.error}</p>
            </div>
          )}

          {/* Results */}
          {!queryLoading && result && result.success && (
            <div className="flex flex-col gap-2">
              <div className="text-xs text-muted-foreground">
                {result.row_count} {t(`${i18n}.result.rows`, 'rows')}
              </div>
              {result.data.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {t(`${i18n}.result.noData`, 'No data')}
                </div>
              ) : (
                <div className="rounded-lg border border-border overflow-auto max-h-[400px]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0">
                      <tr className="bg-muted/30">
                        {columns.map((col) => (
                          <th
                            key={col}
                            onClick={() => handleSort(col)}
                            className="text-left p-2 font-semibold text-xs text-muted-foreground tracking-wide cursor-pointer hover:text-foreground whitespace-nowrap"
                          >
                            {col}
                            {sortCol === col && (
                              <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedData.map((row, ri) => (
                        <tr key={ri} className="border-t border-border hover:bg-muted/40">
                          {columns.map((col) => (
                            <td key={col} className="p-2 text-xs max-w-48">
                              {renderCellValue(row[col], ri, col)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expanded Cell Modal */}
      {expandedCell && result?.data && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setExpandedCell(null)}
        >
          <div
            className="bg-card rounded-xl border border-border shadow-xl max-w-lg w-full mx-4 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">{expandedCell.col}</h3>
              <button
                type="button"
                onClick={() => setExpandedCell(null)}
                className="text-muted-foreground hover:text-foreground text-xl"
              >
                ×
              </button>
            </div>
            <pre className="text-sm bg-muted/50 p-3 rounded-lg overflow-auto max-h-64 whitespace-pre-wrap break-words">
              {String(sortedData[expandedCell.row]?.[expandedCell.col] ?? '')}
            </pre>
          </div>
        </div>
      )}
    </ContentArea>
  );
};

const feature: AdminFeatureModule = {
  id: 'admin-database',
  name: 'AdminDatabasePage',
  adminSection: 'admin-data',
  routes: {
    'admin-database': AdminDatabasePage,
  },
};

export default feature;
