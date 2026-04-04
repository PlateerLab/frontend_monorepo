'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { FiDatabase, FiRefreshCw } from '@xgen/icons';
import {
  getDatabaseInfo,
  getAllTablesInfo,
  getTableSampleData,
  executeQuery,
} from '@xgen/api-client';
import type { DatabaseInfo, TableInfo, QueryResult } from '@xgen/api-client';

const AdminDatabasePage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [queryText, setQueryText] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [queryLoading, setQueryLoading] = useState(false);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [expandedCell, setExpandedCell] = useState<{ row: number; col: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [info, tableList] = await Promise.all([getDatabaseInfo(), getAllTablesInfo()]);
      setDbInfo(info);
      setTables(tableList);
    } catch {
      setDbInfo(null);
      setTables([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectTable = useCallback(async (tableName: string) => {
    setSelectedTable(tableName);
    setQueryLoading(true);
    try {
      const data = await getTableSampleData(tableName, 100);
      setResult(data);
      setQueryText(`SELECT * FROM ${tableName} LIMIT 100`);
    } catch {
      setResult(null);
    } finally {
      setQueryLoading(false);
    }
  }, []);

  const handleExecuteQuery = useCallback(async () => {
    if (!queryText.trim()) return;
    setQueryLoading(true);
    try {
      const data = await executeQuery(queryText);
      setResult(data);
    } catch {
      setResult({ success: false, data: [], row_count: 0, error: 'Query execution failed' });
    } finally {
      setQueryLoading(false);
    }
  }, [queryText]);

  const columns = useMemo(() => {
    if (!result?.data?.length) return [];
    return Object.keys(result.data[0]);
  }, [result]);

  const sortedData = useMemo(() => {
    if (!result?.data) return [];
    if (!sortCol) return result.data;
    return [...result.data].sort((a, b) => {
      const va = a[sortCol] ?? '';
      const vb = b[sortCol] ?? '';
      const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [result, sortCol, sortDir]);

  return (
    <ContentArea>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {t('admin.pages.database.title', 'Database Explorer')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('admin.pages.database.description', 'Browse tables and execute queries')}
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Connection Info */}
        {dbInfo && (
          <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card">
            <FiDatabase className="w-5 h-5 text-primary" />
            <div className="flex items-center gap-6 text-sm">
              <span>
                <span className="text-muted-foreground">Status: </span>
                <span className={dbInfo.connected ? 'text-green-600' : 'text-red-600'}>
                  {dbInfo.connected ? 'Connected' : 'Disconnected'}
                </span>
              </span>
              {dbInfo.db_type && (
                <span><span className="text-muted-foreground">Type: </span>{dbInfo.db_type}</span>
              )}
              {dbInfo.version && (
                <span><span className="text-muted-foreground">Version: </span>{dbInfo.version}</span>
              )}
              <span><span className="text-muted-foreground">Tables: </span>{tables.length}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-[260px_1fr] gap-6 max-lg:grid-cols-1">
          {/* Table List */}
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Tables
            </h2>
            <div className="flex flex-col gap-0.5 max-h-[500px] overflow-auto rounded-lg border border-border">
              {tables.map((table) => (
                <button
                  key={table.name}
                  onClick={() => handleSelectTable(table.name)}
                  className={`flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-muted/50 transition-colors ${
                    selectedTable === table.name ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'
                  }`}
                >
                  <span className="truncate">{table.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{table.row_count}</span>
                </button>
              ))}
              {tables.length === 0 && !loading && (
                <p className="p-3 text-sm text-muted-foreground text-center">No tables</p>
              )}
            </div>
          </div>

          {/* Query + Results */}
          <div className="flex flex-col gap-4">
            {/* Query Editor */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">SQL Query</label>
                <textarea
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleExecuteQuery();
                  }}
                  rows={3}
                  className="w-full px-3 py-2 text-sm font-mono border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="SELECT * FROM ..."
                />
              </div>
              <button
                onClick={handleExecuteQuery}
                disabled={queryLoading || !queryText.trim()}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {queryLoading ? 'Running...' : 'Execute'}
              </button>
            </div>

            {/* Results */}
            {result && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{result.row_count} rows</span>
                  {result.error && <span className="text-red-500">{result.error}</span>}
                </div>
                {result.data.length > 0 && (
                  <div className="rounded-lg border border-border overflow-auto max-h-[400px]">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0">
                        <tr className="bg-muted/80">
                          {columns.map((col) => (
                            <th
                              key={col}
                              onClick={() => {
                                if (sortCol === col) {
                                  setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                                } else {
                                  setSortCol(col);
                                  setSortDir('asc');
                                }
                              }}
                              className="text-left p-2 font-medium text-muted-foreground cursor-pointer hover:text-foreground text-xs whitespace-nowrap"
                            >
                              {col} {sortCol === col && (sortDir === 'asc' ? '↑' : '↓')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedData.map((row, ri) => (
                          <tr key={ri} className="border-t border-border hover:bg-muted/30">
                            {columns.map((col) => {
                              const val = row[col];
                              const str = val === null ? 'NULL' : String(val);
                              const isLong = str.length > 80;
                              return (
                                <td
                                  key={col}
                                  className="p-2 text-xs max-w-48 truncate cursor-default"
                                  title={str}
                                  onClick={() => isLong && setExpandedCell({ row: ri, col })}
                                >
                                  {val === null ? (
                                    <span className="text-muted-foreground italic">NULL</span>
                                  ) : (
                                    str
                                  )}
                                </td>
                              );
                            })}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setExpandedCell(null)}>
            <div className="bg-card rounded-xl border border-border shadow-xl max-w-lg w-full mx-4 p-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">{expandedCell.col}</h3>
                <button onClick={() => setExpandedCell(null)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
              </div>
              <pre className="text-sm bg-muted/50 p-3 rounded-lg overflow-auto max-h-64 whitespace-pre-wrap break-words">
                {String(sortedData[expandedCell.row]?.[expandedCell.col] ?? '')}
              </pre>
            </div>
          </div>
        )}
      </div>
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
