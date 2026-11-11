/**
 * src/components/layout/AppShell.jsx
 *
 * The persistent application shell — rendered on EVERY page.
 * Composes: Sidebar (left) + Topbar (top) + Main content area (right/center).
 *
 * Layout Architecture:
 *   ┌─────────────────────────────────────────────┐
 *   │  Topbar (fixed, full-width adjusted)         │
 *   ├──────────┬──────────────────────────────────┤
 *   │          │                                  │
 *   │ Sidebar  │   <children> (page content)      │
 *   │ (fixed)  │                                  │
 *   │          │                                  │
 *   └──────────┴──────────────────────────────────┘
 *
 * On mobile: Sidebar becomes a slide-over drawer toggled by the Topbar hamburger.
 * On tablet+: Sidebar is permanently visible, content shifts right.
 */
import React, { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import Sidebar, { SIDEBAR_WIDTH } from './Sidebar';
import Topbar from './Topbar';

export default function AppShell({ children }) {
  // Controls mobile sidebar open/close state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* ── Topbar ────────────────────────────────────────────────────────── */}
      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* ── Main Content Area ──────────────────────────────────────────────── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          // On desktop, offset content by sidebar width so it doesn't overlap
          width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          // Push content down below the fixed Topbar height
          pt: { xs: '60px', md: '64px' },
          minHeight: '100vh',
          backgroundColor: 'background.default',
          overflow: 'hidden',
        }}
      >
        {/* Inner wrapper with consistent page padding */}
        <Box
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            maxWidth: 1400,          // Cap content width for ultra-wide screens
            mx: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

