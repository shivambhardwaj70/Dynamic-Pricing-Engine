/**
 * src/components/layout/Topbar.jsx
 *
 * Top application bar — provides:
 *  - Hamburger menu button on mobile (toggles the sidebar)
 *  - Current page title (dynamic based on route)
 *  - Backend health status indicator dot
 *  - Breadcrumb-style route label
 */
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Tooltip,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import FiberManualRecordRoundedIcon from '@mui/icons-material/FiberManualRecordRounded';
import { SIDEBAR_WIDTH } from './Sidebar';
import { healthApi } from '../../api/client';

// ─── Route → Page Title mapping ───────────────────────────────────────────────
const PAGE_TITLES = {
  '/': 'Dashboard',
  '/products': 'Product Catalog',
  '/inventory': 'Inventory Management',
  '/competitors': 'Competitor Pricing',
  '/pricing': 'Pricing Recommendation Engine',
};

export default function Topbar({ onMenuClick }) {
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Backend health state
  const [apiStatus, setApiStatus] = useState('checking'); // 'online' | 'offline' | 'checking'

  // Check backend health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await healthApi.check();
        setApiStatus('online');
      } catch {
        setApiStatus('offline');
      }
    };
    checkHealth();
    // Re-check every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const pageTitle = PAGE_TITLES[location.pathname] || 'DynaPricer';

  const statusConfig = {
    online: { color: '#22C55E', label: 'API Online' },
    offline: { color: '#EF4444', label: 'API Offline' },
    checking: { color: '#F59E0B', label: 'Checking...' },
  };
  const status = statusConfig[apiStatus];

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        // On desktop, the topbar starts AFTER the sidebar
        width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
        ml: { md: `${SIDEBAR_WIDTH}px` },
        backgroundColor: 'rgba(248,250,252,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E2E8F0',
        color: 'text.primary',
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 60, md: 64 }, px: { xs: 2, md: 3 } }}>
        {/* ── Mobile Menu Button ─────────────────────────────────────────── */}
        {isMobile && (
          <IconButton
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 1.5, color: 'text.secondary' }}
            aria-label="Open menu"
          >
            <MenuRoundedIcon />
          </IconButton>
        )}

        {/* ── Page Title ────────────────────────────────────────────────── */}
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1rem', md: '1.125rem' },
              color: 'text.primary',
              letterSpacing: '-0.01em',
            }}
          >
            {pageTitle}
          </Typography>
          {/* Sub-label for the Pricing page (the star demo) */}
          {location.pathname === '/pricing' && (
            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
              ⭐ Primary Demo Page
            </Typography>
          )}
        </Box>

        {/* ── Backend Status Indicator ──────────────────────────────────── */}
        <Tooltip title={status.label} arrow>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              backgroundColor: 'white',
              border: '1px solid #E2E8F0',
              borderRadius: 20,
              px: 1.5,
              py: 0.5,
              cursor: 'default',
            }}
          >
            {apiStatus === 'checking' ? (
              <CircularProgress size={10} sx={{ color: status.color }} />
            ) : (
              <FiberManualRecordRoundedIcon sx={{ fontSize: 10, color: status.color }} />
            )}
            <Typography
              sx={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: status.color,
                display: { xs: 'none', sm: 'block' },
              }}
            >
              {status.label}
            </Typography>
          </Box>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}

