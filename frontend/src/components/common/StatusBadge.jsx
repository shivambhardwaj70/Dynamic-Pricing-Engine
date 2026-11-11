/**
 * src/components/common/StatusBadge.jsx
 *
 * Pill-shaped badge for inventory stock status.
 * Colors match the STATUS_COLORS defined in theme/index.js.
 *
 * Usage:
 *   <StatusBadge status="LOW_STOCK" />
 *   <StatusBadge status="HIGH_STOCK" />
 *   <StatusBadge status="NORMAL_STOCK" />
 */
import React from 'react';
import { Box, Typography } from '@mui/material';
import { STATUS_COLORS } from '../../theme/index';

const STATUS_LABELS = {
  LOW_STOCK: 'Low Stock',
  HIGH_STOCK: 'High Stock',
  NORMAL_STOCK: 'Normal',
};

export default function StatusBadge({ status }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.NORMAL_STOCK;
  const label = STATUS_LABELS[status] || status;

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        backgroundColor: colors.bg,
        color: colors.text,
        borderRadius: 10,
        px: 1.25,
        py: 0.4,
      }}
    >
      {/* Status dot */}
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: colors.dot,
          flexShrink: 0,
        }}
      />
      <Typography
        sx={{
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.02em',
          lineHeight: 1,
          color: 'inherit',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

