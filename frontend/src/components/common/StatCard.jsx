/**
 * src/components/common/StatCard.jsx
 *
 * A KPI metric card for the Dashboard.
 * Shows: icon, title, value, optional trend badge, and optional subtitle.
 *
 * Usage:
 *   <StatCard
 *     title="Total Products"
 *     value={42}
 *     icon={<StorefrontRoundedIcon />}
 *     color="primary"           // 'primary' | 'success' | 'warning' | 'error'
 *     trend={+12}               // optional: percentage change (positive = green, negative = red)
 *     subtitle="In catalog"     // optional secondary text
 *     loading={false}
 *   />
 */
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
} from '@mui/material';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';

// Color mapping for icon containers
const COLOR_MAP = {
  primary: { bg: '#EEF2FF', icon: '#4F46E5', shadow: 'rgba(79,70,229,0.2)' },
  success: { bg: '#DCFCE7', icon: '#16A34A', shadow: 'rgba(22,163,74,0.2)' },
  warning: { bg: '#FEF3C7', icon: '#D97706', shadow: 'rgba(217,119,6,0.2)' },
  error:   { bg: '#FEE2E2', icon: '#B91C1C', shadow: 'rgba(185,28,28,0.2)' },
  info:    { bg: '#E0E7FF', icon: '#4338CA', shadow: 'rgba(67,56,202,0.2)' },
};

export default function StatCard({
  title,
  value,
  icon,
  color = 'primary',
  trend,
  subtitle,
  loading = false,
}) {
  const colors = COLOR_MAP[color] || COLOR_MAP.primary;
  const isPositiveTrend = trend > 0;

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Skeleton variant="rounded" width={48} height={48} />
            <Skeleton variant="rounded" width={60} height={24} />
          </Box>
          <Skeleton variant="text" width="60%" height={40} />
          <Skeleton variant="text" width="40%" height={20} sx={{ mt: 0.5 }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      <CardContent>
        {/* ── Top Row: Icon + Trend Badge ────────────────────────────── */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5 }}>
          {/* Icon Container */}
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2.5,
              backgroundColor: colors.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 12px ${colors.shadow}`,
              '& svg': { fontSize: 24, color: colors.icon },
            }}
          >
            {icon}
          </Box>

          {/* Trend Badge (optional) */}
          {trend !== undefined && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.25,
                backgroundColor: isPositiveTrend ? '#DCFCE7' : '#FEE2E2',
                color: isPositiveTrend ? '#16A34A' : '#B91C1C',
                borderRadius: 10,
                px: 1,
                py: 0.25,
              }}
            >
              {isPositiveTrend
                ? <TrendingUpRoundedIcon sx={{ fontSize: 14 }} />
                : <TrendingDownRoundedIcon sx={{ fontSize: 14 }} />
              }
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, lineHeight: 1 }}>
                {isPositiveTrend ? '+' : ''}{trend}%
              </Typography>
            </Box>
          )}
        </Box>

        {/* ── Metric Value ───────────────────────────────────────────── */}
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            fontSize: '1.875rem',
            color: 'text.primary',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            mb: 0.5,
          }}
        >
          {value ?? '—'}
        </Typography>

        {/* ── Title ──────────────────────────────────────────────────── */}
        <Typography
          variant="body2"
          sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.875rem' }}
        >
          {title}
        </Typography>

        {/* ── Subtitle ───────────────────────────────────────────────── */}
        {subtitle && (
          <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.5, display: 'block' }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

