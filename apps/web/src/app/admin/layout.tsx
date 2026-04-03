'use client';

import { AuthProvider } from '@xgen/auth-provider';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
