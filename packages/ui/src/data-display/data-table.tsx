'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '../primitives/table';
import { cn } from '../lib/utils';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type SortDirection = 'asc' | 'desc';

export interface SortRule<T> {
  field: keyof T;
  direction: SortDirection;
}

export interface DataTableColumn<T> {
  /** 컬럼 ID (T의 키 또는 커스텀 문자열) */
  id: string;
  /** 컬럼 헤더 텍스트 */
  header: string;
  /** 데이터 필드 (정렬용) */
  field?: keyof T;
  /** 셀 렌더러 */
  cell: (row: T) => React.ReactNode;
  /** 정렬 가능 여부 */
  sortable?: boolean;
  /** 커스텀 정렬 비교 함수 */
  sortFn?: (a: T, b: T) => number;
  /** 최소 너비 */
  minWidth?: string;
  /** 헤더 클래스 */
  headerClassName?: string;
  /** 셀 클래스 */
  cellClassName?: string;
}

export interface DataTableProps<T> {
  /** 테이블 데이터 */
  data: T[];
  /** 컬럼 정의 */
  columns: DataTableColumn<T>[];
  /** Row 고유키 추출 */
  rowKey: (row: T) => string | number;
  /** 최대 동시 정렬 컬럼 수 (기본: 3) */
  maxSortColumns?: number;
  /** 빈 데이터 메시지 */
  emptyMessage?: string;
  /** 로딩 상태 */
  loading?: boolean;
  /** 로딩 메시지 */
  loadingMessage?: string;
  /** Row 클릭 핸들러 */
  onRowClick?: (row: T) => void;
  /** 추가 테이블 클래스 */
  className?: string;
  /** Row 클래스 */
  rowClassName?: string | ((row: T) => string);
  /** 외부 정렬 상태 */
  sortRules?: SortRule<T>[];
  /** 외부 정렬 변경 */
  onSortChange?: (rules: SortRule<T>[]) => void;
}

// ─────────────────────────────────────────────────────────────
// Sort Icon
// ─────────────────────────────────────────────────────────────

function SortIcon({ direction }: { direction: SortDirection | null }) {
  if (!direction) {
    return (
      <svg
        className="ml-1 inline-block h-3.5 w-3.5 text-muted-foreground/40"
        viewBox="0 0 16 16"
        fill="currentColor"
      >
        <path d="M8 4l3 4H5l3-4zm0 8l-3-4h6l-3 4z" />
      </svg>
    );
  }

  return (
    <svg
      className={cn(
        'ml-1 inline-block h-3.5 w-3.5 text-foreground transition-transform',
        direction === 'desc' && 'rotate-180',
      )}
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <path d="M8 4l4 5H4l4-5z" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// DataTable Component
// ─────────────────────────────────────────────────────────────

export function DataTable<T>({
  data,
  columns,
  rowKey,
  maxSortColumns = 3,
  emptyMessage = 'No data',
  loading = false,
  loadingMessage = 'Loading...',
  onRowClick,
  className,
  rowClassName,
  sortRules: externalSortRules,
  onSortChange,
}: DataTableProps<T>) {
  const [internalSortRules, setInternalSortRules] = useState<SortRule<T>[]>([]);

  const sortRules = externalSortRules ?? internalSortRules;
  const setSortRules = onSortChange ?? setInternalSortRules;

  // 정렬 핸들러
  const handleSort = useCallback(
    (column: DataTableColumn<T>) => {
      if (!column.sortable) return;
      const field = column.field ?? (column.id as keyof T);

      setSortRules((prev: SortRule<T>[]) => {
        const idx = prev.findIndex((r) => r.field === field);
        const rest = prev.filter((r) => r.field !== field);

        if (idx >= 0) {
          const current = prev[idx];
          const newDir: SortDirection =
            current.direction === 'asc' ? 'desc' : 'asc';
          return [{ field, direction: newDir }, ...rest].slice(
            0,
            maxSortColumns,
          );
        }

        return [{ field, direction: 'asc' as const }, ...rest].slice(
          0,
          maxSortColumns,
        );
      });
    },
    [maxSortColumns, setSortRules],
  );

  // 정렬 방향 조회
  const getSortDirection = useCallback(
    (column: DataTableColumn<T>): SortDirection | null => {
      const field = column.field ?? (column.id as keyof T);
      const rule = sortRules.find((r) => r.field === field);
      return rule?.direction ?? null;
    },
    [sortRules],
  );

  // 정렬된 데이터
  const sortedData = useMemo(() => {
    if (sortRules.length === 0) return data;

    return [...data].sort((a, b) => {
      for (const rule of sortRules) {
        // 커스텀 정렬 함수 확인
        const col = columns.find(
          (c) => (c.field ?? c.id) === (rule.field as string),
        );
        if (col?.sortFn) {
          const cmp = col.sortFn(a, b);
          if (cmp !== 0) return rule.direction === 'asc' ? cmp : -cmp;
          continue;
        }

        const aVal = a[rule.field];
        const bVal = b[rule.field];

        if (aVal == null && bVal == null) continue;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (aVal === bVal) continue;

        const cmp = aVal < bVal ? -1 : 1;
        if (rule.direction === 'asc') return cmp;
        return -cmp;
      }
      return 0;
    });
  }, [data, sortRules, columns]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        {loadingMessage}
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border border-[var(--color-line-50)] overflow-hidden', className)}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border">
            {columns.map((col) => (
              <TableHead
                key={col.id}
                className={cn(
                  col.sortable &&
                    'cursor-pointer select-none hover:bg-muted/50 transition-colors duration-150',
                  col.headerClassName,
                )}
                style={col.minWidth ? { minWidth: col.minWidth } : undefined}
                onClick={() => handleSort(col)}
              >
                <span className="inline-flex items-center">
                  {col.header}
                  {col.sortable && (
                    <SortIcon direction={getSortDirection(col)} />
                  )}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            sortedData.map((row) => {
              const key = rowKey(row);
              const rClassName =
                typeof rowClassName === 'function'
                  ? rowClassName(row)
                  : rowClassName;
              return (
                <TableRow
                  key={key}
                  className={cn(
                    onRowClick && 'cursor-pointer',
                    rClassName,
                  )}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.id}
                      className={col.cellClassName}
                    >
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default DataTable;
