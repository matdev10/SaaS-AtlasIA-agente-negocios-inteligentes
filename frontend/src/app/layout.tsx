import type { Metadata } from 'next';
import { Bebas_Neue, DM_Sans } from 'next/font/google';

import { SupportFab } from '@/components/SupportFab';
import './globals.css';

export const metadata: Metadata = {
  title: 'AtlasIA',
  description: 'Panel de administración AtlasIA',
};

const bebas = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-login-display',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-login-body',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${bebas.variable} ${dmSans.variable}`}>
      <body>
        {children}
        <SupportFab />
      </body>
    </html>
  );
}
