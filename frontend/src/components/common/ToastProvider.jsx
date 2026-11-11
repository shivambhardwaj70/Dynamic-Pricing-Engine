/**
 * src/components/common/ToastProvider.jsx
 *
 * Global Snackbar/Toast notification system.
 *
 * HOW IT WORKS:
 *   We use React Context to create a global `useToast()` hook.
 *   Any component can call:
 *     const { showToast } = useToast();
 *     showToast('Product created!', 'success');
 *
 *   Supported severities: 'success' | 'error' | 'warning' | 'info'
 *
 * SETUP:
 *   Wrap the app in <ToastProvider> in main.jsx (we'll add this in Phase F-7,
 *   but the hook is available now for immediate use in page components).
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, Slide } from '@mui/material';

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

function SlideTransition(props) {
  return <Slide {...props} direction="up" />;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success', // 'success' | 'error' | 'warning' | 'info'
    duration: 4000,
  });

  const showToast = useCallback((message, severity = 'success', duration = 4000) => {
    setToast({ open: true, message, severity, duration });
  }, []);

  const handleClose = (_, reason) => {
    if (reason === 'clickaway') return;
    setToast((prev) => ({ ...prev, open: false }));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Global Snackbar — renders above everything */}
      <Snackbar
        open={toast.open}
        autoHideDuration={toast.duration}
        onClose={handleClose}
        TransitionComponent={SlideTransition}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleClose}
          severity={toast.severity}
          variant="filled"
          sx={{
            borderRadius: 2,
            fontWeight: 600,
            fontSize: '0.875rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            minWidth: 300,
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Graceful fallback if not wrapped in provider (console warning only)
    console.warn('[useToast] Must be used inside <ToastProvider>');
    return { showToast: () => {} };
  }
  return ctx;
}

export default ToastProvider;

