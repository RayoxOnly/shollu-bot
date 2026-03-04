'use client';

import { createTheme } from '@mui/material/styles';

// ── Pixel Experience M3 Color Palette ──
const palette = {
  light: {
    primary:           '#006B5E',
    onPrimary:         '#FFFFFF',
    primaryContainer:  '#73F8DE',
    onPrimaryContainer:'#002019',
    secondary:         '#4B635C',
    onSecondary:       '#FFFFFF',
    secondaryContainer:'#CDE8DF',
    onSecondaryContainer:'#07201A',
    tertiary:          '#426278',
    onTertiary:        '#FFFFFF',
    tertiaryContainer: '#C7E6FF',
    onTertiaryContainer:'#001E31',
    error:             '#BA1A1A',
    onError:           '#FFFFFF',
    errorContainer:    '#FFDAD6',
    onErrorContainer:  '#410002',
    surface:           '#F5FBF7',
    onSurface:         '#171D1B',
    surfaceVariant:    '#DBE5E0',
    onSurfaceVariant:  '#3F4946',
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainerLow:    '#EFF5F1',
    surfaceContainer:       '#E9EFEC',
    surfaceContainerHigh:   '#E3EAE6',
    surfaceContainerHighest:'#DEE4E1',
    outline:           '#6F7975',
    outlineVariant:    '#BFC9C4',
  },
  dark: {
    primary:           '#54DBC2',
    onPrimary:         '#003730',
    primaryContainer:  '#005046',
    onPrimaryContainer:'#73F8DE',
    secondary:         '#B2CCC3',
    onSecondary:       '#1D352F',
    secondaryContainer:'#344C45',
    onSecondaryContainer:'#CDE8DF',
    tertiary:          '#AACBE3',
    onTertiary:        '#103447',
    tertiaryContainer: '#2A4A5F',
    onTertiaryContainer:'#C7E6FF',
    error:             '#FFB4AB',
    onError:           '#690005',
    errorContainer:    '#93000A',
    onErrorContainer:  '#FFDAD6',
    surface:           '#0F1512',
    onSurface:         '#DEE4E1',
    surfaceVariant:    '#3F4946',
    onSurfaceVariant:  '#BFC9C4',
    surfaceContainerLowest: '#0A100E',
    surfaceContainerLow:    '#171D1B',
    surfaceContainer:       '#1B211F',
    surfaceContainerHigh:   '#252B29',
    surfaceContainerHighest:'#303634',
    outline:           '#89938F',
    outlineVariant:    '#3F4946',
  },
};

const m3Theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: palette.light.primary, contrastText: palette.light.onPrimary },
        secondary: { main: palette.light.secondary, contrastText: palette.light.onSecondary },
        error: { main: palette.light.error, contrastText: palette.light.onError },
        background: {
          default: palette.light.surface,
          paper: palette.light.surfaceContainerLow,
        },
        text: {
          primary: palette.light.onSurface,
          secondary: palette.light.onSurfaceVariant,
        },
        divider: palette.light.outlineVariant,
        surfaceContainer: { main: palette.light.surfaceContainer },
        surfaceContainerHigh: { main: palette.light.surfaceContainerHigh },
        surfaceContainerHighest: { main: palette.light.surfaceContainerHighest },
        surfaceContainerLow: { main: palette.light.surfaceContainerLow },
        primaryContainer: { main: palette.light.primaryContainer, contrastText: palette.light.onPrimaryContainer },
        secondaryContainer: { main: palette.light.secondaryContainer, contrastText: palette.light.onSecondaryContainer },
        tertiaryContainer: { main: palette.light.tertiaryContainer, contrastText: palette.light.onTertiaryContainer },
        errorContainer: { main: palette.light.errorContainer, contrastText: palette.light.onErrorContainer },
        outline: { main: palette.light.outline },
        outlineVariant: { main: palette.light.outlineVariant },
      },
    },
    dark: {
      palette: {
        primary: { main: palette.dark.primary, contrastText: palette.dark.onPrimary },
        secondary: { main: palette.dark.secondary, contrastText: palette.dark.onSecondary },
        error: { main: palette.dark.error, contrastText: palette.dark.onError },
        background: {
          default: palette.dark.surface,
          paper: palette.dark.surfaceContainerLow,
        },
        text: {
          primary: palette.dark.onSurface,
          secondary: palette.dark.onSurfaceVariant,
        },
        divider: palette.dark.outlineVariant,
        surfaceContainer: { main: palette.dark.surfaceContainer },
        surfaceContainerHigh: { main: palette.dark.surfaceContainerHigh },
        surfaceContainerHighest: { main: palette.dark.surfaceContainerHighest },
        surfaceContainerLow: { main: palette.dark.surfaceContainerLow },
        primaryContainer: { main: palette.dark.primaryContainer, contrastText: palette.dark.onPrimaryContainer },
        secondaryContainer: { main: palette.dark.secondaryContainer, contrastText: palette.dark.onSecondaryContainer },
        tertiaryContainer: { main: palette.dark.tertiaryContainer, contrastText: palette.dark.onTertiaryContainer },
        errorContainer: { main: palette.dark.errorContainer, contrastText: palette.dark.onErrorContainer },
        outline: { main: palette.dark.outline },
        outlineVariant: { main: palette.dark.outlineVariant },
      },
    },
  },
  typography: {
    fontFamily: '"Inter", "Google Sans", "Roboto", -apple-system, sans-serif',
    h1: { fontWeight: 400, fontSize: '2.25rem', letterSpacing: '-0.02em', lineHeight: 1.2 },
    h2: { fontWeight: 400, fontSize: '1.75rem', letterSpacing: '-0.01em', lineHeight: 1.3 },
    h3: { fontWeight: 500, fontSize: '1.5rem', letterSpacing: 0, lineHeight: 1.3 },
    h4: { fontWeight: 500, fontSize: '1.25rem', letterSpacing: '0.005em', lineHeight: 1.4 },
    h5: { fontWeight: 500, fontSize: '1.1rem', letterSpacing: '0.01em', lineHeight: 1.4 },
    h6: { fontWeight: 500, fontSize: '1rem', letterSpacing: '0.01em', lineHeight: 1.5 },
    subtitle1: { fontWeight: 500, fontSize: '0.95rem', letterSpacing: '0.01em' },
    subtitle2: { fontWeight: 500, fontSize: '0.85rem', letterSpacing: '0.02em' },
    body1: { fontWeight: 400, fontSize: '0.9rem', letterSpacing: '0.01em', lineHeight: 1.6 },
    body2: { fontWeight: 400, fontSize: '0.8rem', letterSpacing: '0.015em', lineHeight: 1.5 },
    button: { fontWeight: 600, fontSize: '0.85rem', letterSpacing: '0.02em', textTransform: 'none' },
    caption: { fontWeight: 400, fontSize: '0.75rem', letterSpacing: '0.03em' },
    overline: { fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase' },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 20,
          padding: '10px 24px',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { borderRadius: 24, border: 'none' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600 },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': { borderRadius: 12 },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 99, height: 8 },
        bar: { borderRadius: 99 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.04em' },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { border: 'none' },
      },
    },
  },
});

export default m3Theme;
