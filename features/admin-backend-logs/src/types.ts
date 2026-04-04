import type { BackendLog } from '@xgen/api-client';

export type { BackendLog };

export type LogLevel = 'error' | 'warning' | 'info' | 'debug';

export type SortField = 'created_at' | 'log_level';
export type SortDirection = 'asc' | 'desc';
