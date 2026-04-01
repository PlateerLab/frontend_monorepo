import type { Metadata } from 'next';
import '@/app/globals.css';
import { LanguageProvider } from '@xgen/i18n';
import { AuthProvider } from '@xgen/auth-provider';
import { ToastProvider } from '@xgen/ui';

export const metadata: Metadata = {
    title: 'XGEN',
    description: 'XGEN - Next-Gen AI Workflow Platform',
    icons: {
        icon: [
            { url: '/favicon.png', sizes: '32x32', type: 'image/x-icon' },
            { url: '/favicon.png', sizes: '32x32', type: 'image/png' }
        ],
        shortcut: '/favicon.png',
        apple: '/favicon.png',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="icon" href="/favicon.png" sizes="32x32" />
            </head>
            <body suppressHydrationWarning>
                <AuthProvider>
                    <LanguageProvider>
                        <ToastProvider position="bottom-right" offset={{ x: 60, y: 60 }}>
                            {children}
                        </ToastProvider>
                    </LanguageProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
