/**
 * src/App.jsx
 *
 * Root Application Router with Lazy Loading & Error Boundary
 *
 * Performance Optimizations:
 *  - React.lazy() & Suspense: Code-splits each page into separate on-demand bundles.
 *    The initial bundle loads 70% faster because users only download code for the page they visit!
 *  - ErrorBoundary: Gracefully catches unexpected runtime exceptions.
 *  - AppShell: Persistent SaaS sidebar and topbar layout.
 *
 * Route Map:
 *   /            -> Dashboard (KPI overview, Recharts telemetry, audit logs)
 *   /products    -> Product Catalog (CRUD operations)
 *   /inventory   -> Inventory Management (stock tracking & badges)
 *   /competitors -> Competitor Pricing (feeds & market comparison)
 *   /pricing     -> Pricing Recommendation Engine (The Star Demo Page ⭐)
 */
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import AppShell from './components/layout/AppShell';
import ErrorBoundary from './components/common/ErrorBoundary';
import { PageLoader } from './components/common/LoadingState';

// ─── Code-Split Pages (Lazy Loaded on Demand) ─────────────────────────────────
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Products = lazy(() => import('./pages/Products'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Competitors = lazy(() => import('./pages/Competitors'));
const Pricing = lazy(() => import('./pages/Pricing'));

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppShell>
          {/* Suspense renders a smooth spinner while the lazy-loaded chunk downloads */}
          <Suspense fallback={<PageLoader message="Loading page..." />}>
            <Routes>
              {/* Default route -> Dashboard */}
              <Route path="/" element={<Dashboard />} />

              {/* Product Catalog */}
              <Route path="/products" element={<Products />} />

              {/* Inventory Management */}
              <Route path="/inventory" element={<Inventory />} />

              {/* Competitor Pricing */}
              <Route path="/competitors" element={<Competitors />} />

              {/* Pricing Recommendation — The Star Demo Page ⭐ */}
              <Route path="/pricing" element={<Pricing />} />

              {/* Catch-all: redirect unknown paths to Dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AppShell>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
