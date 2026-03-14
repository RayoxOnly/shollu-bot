'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
  IconButton,
  Typography,
  Avatar,
} from '@mui/material';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import MosqueRoundedIcon from '@mui/icons-material/MosqueRounded';
import { useColorScheme } from '@mui/material/styles';
import PageTransition from '@/components/PageTransition';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: <DashboardRoundedIcon /> },
  { label: 'Analitik', path: '/analytics', icon: <BarChartRoundedIcon /> },
  { label: 'Riwayat', path: '/logs', icon: <ReceiptLongRoundedIcon /> },
  { label: 'Pengaturan', path: '/settings', icon: <SettingsRoundedIcon /> },
];

const DRAWER_WIDTH = 260;

export default function Navigation({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { mode, setMode } = useColorScheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const toggleTheme = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  const sideContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', py: 2 }}>
      {/* Brand */}
      <Box sx={{ px: 2.5, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
          <MosqueRoundedIcon sx={{ fontSize: 20, color: 'primary.contrastText' }} />
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
          Shollu
        </Typography>
      </Box>

      {/* Nav Items */}
      <List sx={{ px: 1.5, flexGrow: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={active}
                onClick={() => router.push(item.path)}
                sx={{
                  borderRadius: 3,
                  py: 1.2,
                  px: 2,
                  '&.Mui-selected': {
                    bgcolor: 'primaryContainer.main',
                    color: 'primaryContainer.contrastText',
                    '& .MuiListItemIcon-root': {
                      color: 'primaryContainer.contrastText',
                    },
                    '&:hover': {
                      bgcolor: 'primaryContainer.main',
                    },
                  },
                  '&:hover': {
                    bgcolor: 'surfaceContainerHigh.main',
                  },
                  transition: 'all 0.15s ease',
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: active ? 'inherit' : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{ primary: { sx: { fontWeight: active ? 600 : 500, fontSize: '0.88rem' } } }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* M3 Theme Toggle */}
      {mounted && (
        <Box sx={{ px: 2.5, py: 1.5 }}>
          <Box
            onClick={toggleTheme}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
            }}
          >
            {/* M3 Switch Track */}
            <Box
              sx={{
                position: 'relative',
                width: 52,
                height: 32,
                borderRadius: 16,
                bgcolor: mode === 'dark' ? 'primary.main' : 'surfaceContainerHighest.main',
                border: '2px solid',
                borderColor: mode === 'dark' ? 'primary.main' : 'outline.main',
                transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                flexShrink: 0,
                '&:hover': {
                  opacity: 0.92,
                },
              }}
            >
              {/* Thumb */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: mode === 'dark' ? 'calc(100% - 24px - 2px)' : '2px',
                  transform: 'translateY(-50%)',
                  width: mode === 'dark' ? 24 : 20,
                  height: mode === 'dark' ? 24 : 20,
                  borderRadius: '50%',
                  bgcolor: mode === 'dark' ? 'primary.contrastText' : 'outline.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: mode === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                {/* Icon inside thumb */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: mode === 'dark' ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0)',
                    opacity: mode === 'dark' ? 1 : 0,
                    position: 'absolute',
                  }}
                >
                  <DarkModeRoundedIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: mode === 'light' ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0)',
                    opacity: mode === 'light' ? 1 : 0,
                    position: 'absolute',
                  }}
                >
                  <LightModeRoundedIcon sx={{ fontSize: 12, color: 'background.default' }} />
                </Box>
              </Box>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {mode === 'dark' ? 'Mode Gelap' : 'Mode Terang'}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              bgcolor: 'surfaceContainerLow.main',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {sideContent}
        </Drawer>
      )}

      {/* Main */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          pb: { xs: 11, md: 3 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          maxWidth: 1100,
          mx: 'auto',
        }}
      >
        <PageTransition>
          {children}
        </PageTransition>
      </Box>

      {/* Mobile Bottom Nav */}
      {isMobile && (
        <BottomNavigation
          value={pathname}
          onChange={(_, v) => router.push(v)}
          showLabels
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1200,
            height: 80,
            pb: 1.5,
            bgcolor: 'surfaceContainer.main',
            borderTop: '1px solid',
            borderColor: 'divider',
            '& .MuiBottomNavigationAction-root': {
              minWidth: 0,
              py: 1,
              gap: 0.3,
              '&.Mui-selected': {
                color: 'primary.main',
              },
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.7rem',
              fontWeight: 500,
              '&.Mui-selected': { fontWeight: 600, fontSize: '0.7rem' },
            },
          }}
        >
          {NAV_ITEMS.map((item) => (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              value={item.path}
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      )}
    </Box>
  );
}
