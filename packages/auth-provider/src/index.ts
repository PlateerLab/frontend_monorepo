'use client';

export { AuthProvider, useAuth } from './auth-provider';
export type { LoginCredentials, LoginResultState } from './auth-provider';
export { AuthGuard, ReverseAuthGuard, SectionGuard, PermissionGuard } from './guards';

// Re-export types
export type { User, AuthState } from '@xgen/types';
