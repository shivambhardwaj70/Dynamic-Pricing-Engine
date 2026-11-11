/**
 * src/App.jsx
 *
 * Root application component. Owns two things:
 *  1. BrowserRouter — enables client-side routing (no full-page reloads)
 *  2. AppShell — the persistent layout (sidebar + topbar) that wraps every page
 *
 * Route Map:
 *   /            → Dashboard (KPI overview + recent price changes)
 *   /products    → Product Catalog (CRUD operations)
 *   /inventory   → Inventory Management (stock levels + badges)
 *   /competitors → Competitor Pricing (feeds + comparison)
 *   /pricing     → Pricing Recommendation ⭐ Primary Demo Page
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import AppShell from './components/layout/AppShell';

// Page-level components (lazy imports can be added in Phase F-7)
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Competitors from './pages/Competitors';
import Pricing from './pages/Pricing';

function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          {/* Default route → Dashboard */}
          <Route path="/" element={<Dashboard />} />

          {/* Product Catalog */}
          <Route path="/products" element={<Products />} />

          {/* Inventory Management */}
          <Route path="/inventory" element={<Inventory />} />

          {/* Competitor Pricing */}
          <Route path="/competitors" element={<Competitors />} />

          {/* Pricing Recommendation — The Star Demo Page */}
          <Route path="/pricing" element={<Pricing />} />

          {/* Catch-all: redirect unknown routes to Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

export default App;

