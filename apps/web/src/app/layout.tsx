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
    const theme = process.env.NEXT_PUBLIC_THEME || '';

    return (
        <html lang="en" data-theme={theme || undefined} suppressHydrationWarning>
            <head>
                <link rel="icon" href="/favicon.png" sizes="32x32" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@100..900&display=swap"
                />
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
