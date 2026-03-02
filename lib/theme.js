import { createTheme } from '@mui/material/styles';

const m3Theme = createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: '#006B5B', // Teal/Emerald M3
          contrastText: '#FFFFFF',
        },
        secondary: {
          main: '#4A635D',
          contrastText: '#FFFFFF',
        },
        tertiary: {
          main: '#446179',
          contrastText: '#FFFFFF',
        },
        background: {
          default: '#FBFDF9',
          paper: '#FBFDF9',
        },
        surfaceVariant: {
          main: '#DBE5E0',
          contrastText: '#3F4946',
        }
      }
    },
    dark: {
      palette: {
        primary: {
          main: '#59DBC1',
          contrastText: '#00382E',
        },
        secondary: {
          main: '#B1CCC4',
          contrastText: '#1C352F',
        },
        tertiary: {
          main: '#ADC9E6',
          contrastText: '#143248',
        },
        background: {
          default: '#191C1B',
          paper: '#191C1B',
        },
        surfaceVariant: {
          main: '#3F4946',
          contrastText: '#BFC9C4',
        }
      }
    }
  },
  typography: {
    fontFamily: 'var(--font-inter), Inter, Roboto, Arial, sans-serif',
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        }
      }
    },
  },
});

export default m3Theme;
