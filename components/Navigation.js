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
} from '@mui/material';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import { useColorScheme } from '@mui/material/styles';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: <DashboardRoundedIcon /> },
  { label: 'Analitik', path: '/analytics', icon: <BarChartRoundedIcon /> },
  { label: 'Riwayat', path: '/logs', icon: <ReceiptLongRoundedIcon /> },
  { label: 'Pengaturan', path: '/settings', icon: <SettingsRoundedIcon /> },
];

const DRAWER_WIDTH = 280;
const RAIL_WIDTH = 80;

export default function Navigation({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const { mode, setMode } = useColorScheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  const navContent = (
    <>
      <List sx={{ mt: isMobile ? 0 : 2, flexGrow: 1, px: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                selected={active}
                onClick={() => router.push(item.path)}
                sx={{
                  borderRadius: 3,
                  py: 1.5,
                  minHeight: isTablet ? 56 : 'auto',
                  justifyContent: isTablet ? 'center' : 'flex-start',
                  flexDirection: isTablet ? 'column' : 'row',
                  '&.Mui-selected': {
                    backgroundColor: 'primary.primaryContainer',
                    color: 'primary.onPrimaryContainer',
                    '& .MuiListItemIcon-root': {
                      color: 'primary.onPrimaryContainer',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: isTablet ? 'auto' : 40,
                    color: active ? 'primary.onPrimaryContainer' : 'inherit',
                    justifyContent: 'center',
                    mb: isTablet ? 0.5 : 0,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!isTablet && (
                  <ListItemText
                    primary={item.label}
                    slotProps={{ primary: { fontWeight: active ? 600 : 400 } }}
                  />
                )}
                {isTablet && (
                  <Box sx={{ fontSize: '0.65rem', fontWeight: active ? 600 : 400 }}>
                    {item.label}
                  </Box>
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      
      {!isMobile && (
        <Box sx={{ p: 2, display: 'flex', justifyContent: isTablet ? 'center' : 'flex-start' }}>
          {mounted && (
            <IconButton onClick={toggleTheme} color="inherit" size="large">
              {mode === 'dark' ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
            </IconButton>
          )}
        </Box>
      )}
    </>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Desktop / Tablet Navigation */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: isTablet ? RAIL_WIDTH : DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: isTablet ? RAIL_WIDTH : DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: 'none',
              bgcolor: 'surfaceVariant.main', // M3 typical drawer color
              color: 'surfaceVariant.contrastText',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          }}
        >
          {navContent}
        </Drawer>
      )}

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          pb: { xs: 10, sm: 4 }, // Extra padding on mobile for bottom nav
          width: { sm: `calc(100% - ${isTablet ? RAIL_WIDTH : DRAWER_WIDTH}px)` },
          maxWidth: '1200px',
          mx: 'auto',
        }}
      >
        {children}
      </Box>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <BottomNavigation
          value={pathname}
          onChange={(_, newValue) => router.push(newValue)}
          showLabels
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.appBar,
            height: 80,
            pb: 2,
            bgcolor: 'surfaceVariant.main',
            borderTop: 'none',
            boxShadow: theme.shadows[4],
          }}
        >
          {NAV_ITEMS.map((item) => (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              value={item.path}
              icon={item.icon}
              sx={{
                '&.Mui-selected': {
                  color: 'primary.main',
                  '& .MuiBottomNavigationAction-label': {
                    fontWeight: 600,
                  }
                },
              }}
            />
          ))}
        </BottomNavigation>
      )}
    </Box>
  );
}
