import type { Metadata } from 'next';
import '@xgen/styles/src/globals.css';

export const metadata: Metadata = {
  title: 'XGEN',
  description: 'XGEN AI Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
