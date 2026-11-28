import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { festiveSeasonNow } from '@/lib/festive';
import { Geist, Geist_Mono, Playfair_Display } from 'next/font/google';
import './globals.css';

import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { MotionProvider } from './components/MotionProvider';
import { ConsentProvider } from './components/consent/ConsentContext';
import { CookieNotice } from './components/consent/CookieNotice';
import { NavigationShell } from './components/navigation/NavigationShell';
import { Toaster } from 'sonner';
import 'sonner/dist/styles.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const playfairDisplay = Playfair_Display({
  variable: '--font-playfair-display',
  subsets: ['latin'],
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Alora · Premium Hair & Beauty Appointments',
    template: '%s · Alora',
  },
  description:
    'Book premium hair and beauty appointments with Alora. Earn loyalty rewards on every visit.',
  applicationName: 'Alora',
  formatDetection: { telephone: false, email: false, address: false, date: false },
  openGraph: {
    type: 'website',
    siteName: 'Alora',
    title: 'Alora · Premium Hair & Beauty Appointments',
    description:
      'Book premium hair and beauty appointments with Alora. Earn loyalty rewards on every visit.',
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alora · Premium Hair & Beauty Appointments',
    description: 'Book premium hair and beauty appointments with Alora.',
  },
};

const themeScript = `
  (function() {
    var theme = null;
    try {
      var saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') theme = saved;
    } catch (e) {}
    if (!theme) {
      try {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } catch (e) {
        theme = 'light';
      }
    }
    document.documentElement.setAttribute('data-theme', theme);
  })();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    <html lang="en" data-festive={festiveSeasonNow() ? 'true' : undefined} suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable}`}>
        <AuthProvider>
          <ThemeProvider>
            <MotionProvider nonce={nonce}>
              <ConsentProvider>
                <Toaster />
                <NavigationShell>{children}</NavigationShell>
                <CookieNotice />
              </ConsentProvider>
            </MotionProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
