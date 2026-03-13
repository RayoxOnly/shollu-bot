import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import Providers from '@/components/Providers';
import './globals.css';

export const metadata = {
  title: 'Shollu Bot',
  description: 'Otomatisasi Absen Sholat Shollu',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#006B5E',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <InitColorSchemeScript attribute="class" defaultMode="system" />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
