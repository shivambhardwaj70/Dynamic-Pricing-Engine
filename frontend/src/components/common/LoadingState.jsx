/**
 * src/components/common/LoadingState.jsx
 *
 * Reusable loading, empty, and error states to avoid repetitive boilerplate.
 *
 * Usage:
 *   // Loading skeleton
 *   <LoadingState rows={5} />
 *
 *   // Empty state
 *   <EmptyState
 *     icon={<StorefrontRoundedIcon />}
 *     title="No Products Yet"
 *     message="Click 'Add Product' to create your first product."
 *   />
 *
 *   // Error state
 *   <ErrorState message="Failed to load products." onRetry={fetchProducts} />
 */
import React from 'react';
import {
  Box,
  Typography,
  Button,
  Skeleton,
  Alert,
  CircularProgress,
} from '@mui/material';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';

// ─── Loading Skeleton (table rows) ───────────────────────────────────────────
export function LoadingState({ rows = 4, cols = 4 }) {
  return (
    <Box sx={{ p: 2 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} variant="rounded" height={36} sx={{ flex: 1 }} />
          ))}
        </Box>
      ))}
    </Box>
  );
}

// ─── Full-page loading spinner ────────────────────────────────────────────────
export function PageLoader({ message = 'Loading...' }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 300,
        gap: 2,
      }}
    >
      <CircularProgress size={40} thickness={3} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────
export function EmptyState({
  icon,
  title = 'No Data Found',
  message = 'Nothing to display here yet.',
  action,
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py: 8,
        px: 3,
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          backgroundColor: '#F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 1,
          '& svg': { fontSize: 32, color: '#94A3B8' },
        }}
      >
        {icon || <InboxRoundedIcon />}
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 360 }}>
        {message}
      </Typography>
      {action && <Box sx={{ mt: 1 }}>{action}</Box>}
    </Box>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────
export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <Box sx={{ p: 3 }}>
      <Alert
        severity="error"
        action={
          onRetry && (
            <Button
              color="error"
              size="small"
              startIcon={<RefreshRoundedIcon />}
              onClick={onRetry}
            >
              Retry
            </Button>
          )
        }
        sx={{ borderRadius: 2 }}
      >
        {message}
      </Alert>
    </Box>
  );
}

// Default export — table skeleton for convenience
export default LoadingState;

