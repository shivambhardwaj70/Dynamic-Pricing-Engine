/**
 * src/components/common/PageHeader.jsx
 *
 * Consistent page header used at the top of every page.
 * Provides: title, subtitle, and an optional action button slot.
 *
 * Usage:
 *   <PageHeader
 *     title="Product Catalog"
 *     subtitle="Manage and monitor your complete product listing"
 *     action={<Button variant="contained">Add Product</Button>}
 *   />
 */
import React from 'react';
import { Box, Typography, Divider } from '@mui/material';

export default function PageHeader({ title, subtitle, action, children }) {
  return (
    <Box sx={{ mb: 4 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          gap: 2,
          mb: 2,
        }}
      >
        {/* ── Left: Title + Subtitle ─────────────────────────────────── */}
        <Box>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.375rem', md: '1.625rem' },
              color: 'text.primary',
              letterSpacing: '-0.025em',
              lineHeight: 1.2,
              mb: 0.5,
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', fontSize: '0.9375rem', maxWidth: 560 }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {/* ── Right: Action Slot ──────────────────────────────────────── */}
        {action && (
          <Box sx={{ flexShrink: 0 }}>
            {action}
          </Box>
        )}
      </Box>

      {/* Optional children (e.g., filter tabs) */}
      {children}

      <Divider sx={{ mt: 2, borderColor: '#E2E8F0' }} />
    </Box>
  );
}

