/**
 * src/main.jsx
 *
 * React application entry point.
 * - Mounts the React tree into the #root div in index.html
 * - Wraps the entire app in ThemeProvider so every component inherits our custom MUI theme
 * - CssBaseline resets browser defaults and applies our body/scrollbar styles
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import App from './App';
import theme from './theme/index';
import { ToastProvider } from './components/common/ToastProvider';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      {/* CssBaseline injects a CSS reset + our custom scrollbar/body styles */}
      <CssBaseline />
      {/* ToastProvider makes useToast() available in every component globally */}
      <ToastProvider>
        <App />
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>
);
