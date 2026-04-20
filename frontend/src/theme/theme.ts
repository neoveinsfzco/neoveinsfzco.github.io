// src/theme/theme.ts
import { createTheme } from '@mui/material/styles';
import type { ThemeOptions, PaletteMode } from '@mui/material';
import { createContext } from 'react';

export const ColorModeContext = createContext({
  toggleColorMode: () => {},
});

const getDesignTokens = (mode: PaletteMode): ThemeOptions => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          primary: {
            main: '#224B8F',
            light: '#4C7AC8',
            dark: '#18386B',
          },
          secondary: {
            main: '#0EA5A4',
            light: '#4FD1C5',
            dark: '#0B7B7A',
          },
          background: {
            default: '#E6EDF6',
            paper: '#F6F8FC',
          },
          divider: 'rgba(148, 163, 184, 0.35)',
        }
      : {
          primary: {
            main: '#8FB6FF',
            light: '#B3CDFF',
            dark: '#6D92E0',
          },
          secondary: {
            main: '#36D6D6',
            light: '#7DE2E2',
            dark: '#1DB2B2',
          },
          background: {
            default: '#0B1220',
            paper: '#101A2E',
          },
          divider: 'rgba(148, 163, 184, 0.2)',
        }),
  },
  shape: {
    borderRadius: 20,
  },
  typography: {
    fontFamily: '"Manrope", "Space Grotesk", sans-serif',
    h6: {
      fontWeight: 700,
      letterSpacing: 0.2,
    },
    subtitle1: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            mode === 'light'
              ? 'radial-gradient(circle at 10% 10%, rgba(214, 228, 255, 0.9), transparent 55%), radial-gradient(circle at 80% 0%, rgba(220, 236, 250, 0.9), transparent 50%), #E6EDF6'
              : 'radial-gradient(circle at 10% 10%, rgba(38, 70, 140, 0.45), transparent 55%), radial-gradient(circle at 80% 0%, rgba(20, 36, 70, 0.6), transparent 50%), #0B1220',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          backgroundColor:
            mode === 'light'
              ? 'rgba(255, 255, 255, 0.75)'
              : 'rgba(16, 26, 46, 0.75)',
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(148, 163, 184, 0.25)',
          boxShadow: '0 12px 32px rgba(15, 23, 42, 0.12)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 22,
          backgroundColor:
            mode === 'light'
              ? 'rgba(255, 255, 255, 0.78)'
              : 'rgba(16, 26, 46, 0.78)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          boxShadow: '0 16px 40px rgba(15, 23, 42, 0.14)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor:
            mode === 'light'
              ? 'rgba(255, 255, 255, 0.75)'
              : 'rgba(16, 26, 46, 0.78)',
          color: mode === 'light' ? '#0F172A' : '#E2E8F0',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.25)',
          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 14,
          fontWeight: 600,
        },
        contained: {
          boxShadow: '0 10px 20px rgba(30, 58, 138, 0.25)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 600,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          backgroundColor:
            mode === 'light'
              ? 'rgba(255, 255, 255, 0.7)'
              : 'rgba(16, 26, 46, 0.7)',
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(148, 163, 184, 0.25)',
          borderRadius: 18,
          backgroundColor:
            mode === 'light'
              ? 'rgba(255, 255, 255, 0.6)'
              : 'rgba(16, 26, 46, 0.6)',
          backdropFilter: 'blur(10px)',
        },
        columnHeaders: {
          backgroundColor:
            mode === 'light'
              ? 'rgba(226, 232, 240, 0.65)'
              : 'rgba(30, 41, 59, 0.75)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.3)',
        },
        row: {
          '&:hover': {
            backgroundColor:
              mode === 'light'
                ? 'rgba(226, 232, 240, 0.4)'
                : 'rgba(30, 41, 59, 0.4)',
          },
        },
      },
    },
  },
});

export const getTheme = (mode: PaletteMode) => createTheme(getDesignTokens(mode));
