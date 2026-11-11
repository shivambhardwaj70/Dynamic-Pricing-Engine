/**
 * src/theme/index.js
 *
 * Global Material UI theme for DynaPricer.
 *
 * Design decisions:
 *  - Font: "Inter" — the industry-standard SaaS typography (Notion, Linear, Vercel)
 *  - Primary: Indigo (#4F46E5) — trusted, professional, clearly "enterprise"
 *  - Secondary: Cyan (#06B6D4) — complementary accent for highlights
 *  - Sidebar: Dark Navy (#0F172A / Slate-900) — classic dark sidebar on light content
 *  - Background: Off-white (#F8FAFC) — softer than pure white, reduces eye strain
 *  - Cards: Pure white with subtle shadow — information hierarchy
 *  - Border radius: 12px on cards, 8px on inputs — modern but not bubbly
 */
import { createTheme, alpha } from '@mui/material/styles';

// ─── Palette Constants ───────────────────────────────────────────────────────
const INDIGO = {
  50: '#EEF2FF',
  100: '#E0E7FF',
  200: '#C7D2FE',
  500: '#6366F1',
  600: '#4F46E5',
  700: '#4338CA',
  800: '#3730A3',
  900: '#312E81',
};

const NAVY = '#0F172A';   // Sidebar background (Slate-900)
const CYAN = '#06B6D4';

// ─── Status / Semantic Colors (used in StatusBadge) ─────────────────────────
export const STATUS_COLORS = {
  LOW_STOCK: { bg: '#FEE2E2', text: '#B91C1C', dot: '#EF4444' },
  HIGH_STOCK: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  NORMAL_STOCK: { bg: '#DCFCE7', text: '#166534', dot: '#22C55E' },
};

const theme = createTheme({
  // ── Typography ─────────────────────────────────────────────────────────────
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: { fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' },
    h2: { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontSize: '1.125rem', fontWeight: 600 },
    h5: { fontSize: '1rem', fontWeight: 600 },
    h6: { fontSize: '0.875rem', fontWeight: 600 },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.6, color: '#64748B' },
    caption: { fontSize: '0.75rem', letterSpacing: '0.03em' },
    button: { fontWeight: 600, letterSpacing: '0.01em', textTransform: 'none' },
    overline: { fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.6875rem' },
  },

  // ── Color Palette ──────────────────────────────────────────────────────────
  palette: {
    mode: 'light',
    primary: {
      main: INDIGO[600],
      light: INDIGO[500],
      dark: INDIGO[700],
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: CYAN,
      light: '#67E8F9',
      dark: '#0E7490',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F8FAFC',   // Page background
      paper: '#FFFFFF',     // Card/surface background
    },
    text: {
      primary: '#0F172A',   // Slate-900 — maximum readability
      secondary: '#64748B', // Slate-500 — de-emphasized text
      disabled: '#CBD5E1',
    },
    divider: '#E2E8F0',     // Slate-200
    success: { main: '#22C55E', light: '#86EFAC', dark: '#16A34A', contrastText: '#fff' },
    warning: { main: '#F59E0B', light: '#FDE68A', dark: '#D97706', contrastText: '#fff' },
    error: { main: '#EF4444', light: '#FCA5A5', dark: '#B91C1C', contrastText: '#fff' },
    info: { main: INDIGO[500], light: INDIGO[200], dark: INDIGO[700], contrastText: '#fff' },
    // Custom navy for sidebar (accessed as theme.palette.navy)
    navy: { main: NAVY },
  },

  // ── Shape ─────────────────────────────────────────────────────────────────
  shape: { borderRadius: 12 },

  // ── Shadows ───────────────────────────────────────────────────────────────
  // Subtle elevation system — avoids heavy box shadows common in older MUIs
  shadows: [
    'none',
    '0 1px 2px rgba(15,23,42,0.06)',
    '0 1px 4px rgba(15,23,42,0.08)',
    '0 2px 8px rgba(15,23,42,0.08)',
    '0 4px 16px rgba(15,23,42,0.10)',
    '0 8px 24px rgba(15,23,42,0.12)',
    '0 12px 32px rgba(15,23,42,0.14)',
    '0 16px 48px rgba(15,23,42,0.16)',
    ...Array(17).fill('none'), // fill remaining MUI shadow slots
  ],

  // ── Component Overrides ────────────────────────────────────────────────────
  components: {
    // ── MuiCssBaseline ──────────────────────────────────────────────────────
    MuiCssBaseline: {
      styleOverrides: {
        '*': { boxSizing: 'border-box' },
        body: {
          backgroundColor: '#F8FAFC',
          fontFamily: '"Inter", sans-serif',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        '::-webkit-scrollbar': { width: '6px', height: '6px' },
        '::-webkit-scrollbar-track': { background: 'transparent' },
        '::-webkit-scrollbar-thumb': { background: '#CBD5E1', borderRadius: '3px' },
        '::-webkit-scrollbar-thumb:hover': { background: '#94A3B8' },
      },
    },

    // ── MuiCard ─────────────────────────────────────────────────────────────
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
          transition: 'box-shadow 0.2s ease',
          '&:hover': { boxShadow: '0 4px 16px rgba(15,23,42,0.10)' },
        },
      },
    },

    // ── MuiCardContent ──────────────────────────────────────────────────────
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '24px',
          '&:last-child': { paddingBottom: '24px' },
        },
      },
    },

    // ── MuiButton ───────────────────────────────────────────────────────────
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          fontSize: '0.875rem',
          padding: '8px 20px',
          transition: 'all 0.15s ease',
        },
        contained: {
          '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(79,70,229,0.3)' },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': { borderWidth: '1.5px' },
        },
      },
    },

    // ── MuiTextField ────────────────────────────────────────────────────────
    MuiTextField: {
      defaultProps: { size: 'small', variant: 'outlined' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#FFFFFF',
            transition: 'box-shadow 0.15s ease',
            '&.Mui-focused': { boxShadow: `0 0 0 3px ${alpha(INDIGO[600], 0.15)}` },
          },
        },
      },
    },

    // ── MuiSelect / MuiInputBase ─────────────────────────────────────────────
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: INDIGO[600],
            borderWidth: '2px',
          },
        },
      },
    },

    // ── MuiChip ─────────────────────────────────────────────────────────────
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.75rem', borderRadius: 6 },
      },
    },

    // ── MuiTableHead ────────────────────────────────────────────────────────
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#F8FAFC',
            color: '#64748B',
            fontWeight: 700,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            borderBottom: '2px solid #E2E8F0',
            padding: '12px 16px',
          },
        },
      },
    },

    // ── MuiTableCell ────────────────────────────────────────────────────────
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #F1F5F9',
          padding: '14px 16px',
          fontSize: '0.875rem',
        },
      },
    },

    // ── MuiTableRow ─────────────────────────────────────────────────────────
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: '#F8FAFC' },
          '&:last-child td': { borderBottom: 'none' },
        },
      },
    },

    // ── MuiDialog ───────────────────────────────────────────────────────────
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 20, padding: '8px' },
      },
    },

    // ── MuiDialogTitle ──────────────────────────────────────────────────────
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontWeight: 700, fontSize: '1.125rem', paddingBottom: '8px' },
      },
    },

    // ── MuiLinearProgress ───────────────────────────────────────────────────
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, height: 6 },
      },
    },

    // ── MuiAlert ────────────────────────────────────────────────────────────
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10, fontWeight: 500 },
      },
    },

    // ── MuiSnackbar ─────────────────────────────────────────────────────────
    MuiSnackbar: {
      defaultProps: { anchorOrigin: { vertical: 'bottom', horizontal: 'right' } },
    },

    // ── MuiTooltip ──────────────────────────────────────────────────────────
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: NAVY,
          fontSize: '0.75rem',
          borderRadius: 6,
          fontWeight: 500,
        },
      },
    },
  },
});

export default theme;
