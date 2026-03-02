import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import Providers from '@/components/Providers';
import './globals.css';

export const metadata = {
  title: 'Shollu Bot',
  description: 'Otomatisasi Absen Sholat Shollu',
  themeColor: '#006B5B',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <InitColorSchemeScript attribute="class" />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
