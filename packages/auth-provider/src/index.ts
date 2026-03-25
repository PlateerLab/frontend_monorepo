'use client';

export { AuthProvider, useAuth } from './auth-provider';
export { AuthGuard, SectionGuard, PermissionGuard } from './guards';

// Re-export types
export type { User, AuthState } from '@xgen/types';
