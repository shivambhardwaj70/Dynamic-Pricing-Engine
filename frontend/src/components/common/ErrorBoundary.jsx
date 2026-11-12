/**
 * src/components/common/ErrorBoundary.jsx
 *
 * React Error Boundary Component
 *
 * Purpose:
 *   Catches JavaScript runtime errors anywhere in the child component tree,
 *   logs the error, and renders a fallback UI instead of crashing the whole app
 *   into a blank white screen.
 *
 * Why a Class Component?
 *   In modern React, Error Boundaries MUST be class components because the
 *   lifecycle methods `static getDerivedStateFromError` and `componentDidCatch`
 *   do not have hook equivalents yet in React 18.
 */
import React from 'react';
import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * Purpose:
   *   Updates state so the next render will show the fallback UI.
   *
   * When it executes:
   *   - Automatically whenever a child component throws an uncaught error.
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /**
   * Purpose:
   *   Logs the error and component stack trace for debugging telemetry.
   */
  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught an uncaught runtime error:', error, errorInfo);
  }

  /**
   * Purpose:
   *   Resets the error boundary state and attempts to re-render children.
   */
  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '60vh',
            p: 3,
          }}
        >
          <Card
            sx={{
              maxWidth: 540,
              width: '100%',
              borderRadius: 3,
              border: '1px solid #FEE2E2',
              backgroundColor: '#FEF2F2',
              textAlign: 'center',
              boxShadow: '0 8px 30px rgba(239,68,68,0.1)',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <WarningAmberRoundedIcon sx={{ fontSize: 32, color: 'error.main' }} />
              </Box>

              <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
                Something went wrong
              </Typography>

              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                An unexpected error occurred while rendering this view. Your data is safe.
              </Typography>

              {this.state.error?.message && (
                <Box
                  sx={{
                    p: 1.5,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 2,
                    border: '1px solid #FECACA',
                    mb: 3,
                    textAlign: 'left',
                  }}
                >
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'error.dark' }}>
                    {this.state.error.message}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshRoundedIcon />}
                  onClick={this.handleReset}
                >
                  Try Again
                </Button>
                <Button
                  variant="contained"
                  startIcon={<HomeRoundedIcon />}
                  onClick={() => {
                    this.handleReset();
                    window.location.href = '/';
                  }}
                >
                  Go to Dashboard
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

