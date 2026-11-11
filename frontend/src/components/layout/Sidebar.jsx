/**
 * src/components/layout/Sidebar.jsx
 *
 * Dark navy sidebar navigation.
 *
 * Design decisions:
 *  - Navy (#0F172A) background — industry-standard SaaS sidebar color (Linear, Vercel, Supabase)
 *  - Active route is highlighted with an indigo pill background + left accent bar
 *  - Icons + labels for quick visual scanning
 *  - Collapsible on mobile (controlled by `open` prop from AppShell)
 *  - MUI Drawer used for both persistent desktop sidebar and modal mobile drawer
 */
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded';
import AutoGraphRoundedIcon from '@mui/icons-material/AutoGraphRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';

// ─── Sidebar width constant (also used in AppShell for content offset) ───────
export const SIDEBAR_WIDTH = 260;

// ─── Navigation Items ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    label: 'Dashboard',
    path: '/',
    icon: <DashboardRoundedIcon />,
    exact: true,
  },
  {
    label: 'Products',
    path: '/products',
    icon: <StorefrontRoundedIcon />,
  },
  {
    label: 'Inventory',
    path: '/inventory',
    icon: <Inventory2RoundedIcon />,
  },
  {
    label: 'Competitors',
    path: '/competitors',
    icon: <CompareArrowsRoundedIcon />,
  },
  {
    label: 'Pricing Engine',
    path: '/pricing',
    icon: <AutoGraphRoundedIcon />,
    badge: 'DEMO',  // Highlight the star demo page
  },
];

// ─── NavItem Component ────────────────────────────────────────────────────────
function NavItem({ item, isActive, onClick }) {
  return (
    <ListItem disablePadding sx={{ mb: 0.5, px: 1.5 }}>
      <ListItemButton
        onClick={onClick}
        sx={{
          borderRadius: 2,
          py: 1.1,
          px: 1.5,
          position: 'relative',
          transition: 'all 0.15s ease',
          backgroundColor: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
          // Left accent bar for active item
          '&::before': isActive
            ? {
                content: '""',
                position: 'absolute',
                left: -6,
                top: '20%',
                height: '60%',
                width: 3,
                borderRadius: '0 3px 3px 0',
                backgroundColor: '#6366F1',
              }
            : {},
          '&:hover': {
            backgroundColor: isActive
              ? 'rgba(99,102,241,0.2)'
              : 'rgba(255,255,255,0.06)',
          },
        }}
      >
        <ListItemIcon
          sx={{
            color: isActive ? '#818CF8' : 'rgba(255,255,255,0.45)',
            minWidth: 38,
            transition: 'color 0.15s ease',
          }}
        >
          {item.icon}
        </ListItemIcon>
        <ListItemText
          primary={item.label}
          primaryTypographyProps={{
            fontSize: '0.875rem',
            fontWeight: isActive ? 600 : 400,
            color: isActive ? '#E0E7FF' : 'rgba(255,255,255,0.65)',
            fontFamily: '"Inter", sans-serif',
            letterSpacing: '0.01em',
          }}
        />
        {item.badge && (
          <Chip
            label={item.badge}
            size="small"
            sx={{
              height: 18,
              fontSize: '0.6rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              backgroundColor: '#4F46E5',
              color: '#fff',
              borderRadius: 1,
              '& .MuiChip-label': { px: 0.75 },
            }}
          />
        )}
      </ListItemButton>
    </ListItem>
  );
}

// ─── Sidebar Content ──────────────────────────────────────────────────────────
function SidebarContent({ onNavigate }) {
  const location = useLocation();

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        height: '100%',
        backgroundColor: '#0F172A',  // Navy — Slate 900
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ── Brand / Logo Area ───────────────────────────────────────────── */}
      <Box
        sx={{
          px: 2.5,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          mb: 1,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
          }}
        >
          <BoltRoundedIcon sx={{ color: '#fff', fontSize: 20 }} />
        </Box>
        <Box>
          <Typography
            variant="h6"
            sx={{
              color: '#F1F5F9',
              fontWeight: 800,
              fontSize: '0.9375rem',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
            }}
          >
            DynaPricer
          </Typography>
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.35)',
              fontSize: '0.6875rem',
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Pricing Engine
          </Typography>
        </Box>
      </Box>

      {/* ── Navigation Label ────────────────────────────────────────────── */}
      <Typography
        sx={{
          px: 2.5,
          mb: 1,
          mt: 0.5,
          fontSize: '0.6875rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.25)',
        }}
      >
        Navigation
      </Typography>

      {/* ── Nav Items ───────────────────────────────────────────────────── */}
      <List dense disablePadding sx={{ flex: 1 }}>
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.path}
            item={item}
            isActive={isActive(item)}
            onClick={() => onNavigate(item.path)}
          />
        ))}
      </List>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <Box
        sx={{
          px: 2,
          py: 2,
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Box
          sx={{
            backgroundColor: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 2,
            p: 1.5,
          }}
        >
          <Typography sx={{ color: '#818CF8', fontSize: '0.75rem', fontWeight: 600, mb: 0.25 }}>
            Backend API
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.6875rem', fontFamily: 'monospace' }}>
            localhost:5001/api
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// ─── Sidebar Main Export ───────────────────────────────────────────────────────
export default function Sidebar({ open, onClose }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) onClose(); // Auto-close on mobile after navigation
  };

  if (isMobile) {
    // On mobile: render as a temporary (modal) drawer that slides over content
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            border: 'none',
            boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
          },
        }}
      >
        <SidebarContent onNavigate={handleNavigate} />
      </Drawer>
    );
  }

  // On desktop: render as a permanent sidebar (always visible, pushes content right)
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: SIDEBAR_WIDTH,
          border: 'none',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
        },
      }}
    >
      <SidebarContent onNavigate={handleNavigate} />
    </Drawer>
  );
}

