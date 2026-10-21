import type { Metadata } from 'next';

import { SupportFab } from '@/components/SupportFab';
import './globals.css';

export const metadata: Metadata = {
  title: 'AtlasIA',
  description: 'Panel de administración AtlasIA',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        {children}
        <SupportFab />
      </body>
    </html>
  );
}
