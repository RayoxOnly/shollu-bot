'use client';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '@/lib/theme';
import Navigation from '@/components/Navigation';
import { ToastProvider } from '@/components/Toast';

export default function Providers({ children }) {
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ToastProvider>
          <Navigation>
            {children}
          </Navigation>
        </ToastProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
