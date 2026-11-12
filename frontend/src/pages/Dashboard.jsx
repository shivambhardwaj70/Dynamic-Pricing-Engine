/**
 * src/pages/Dashboard.jsx
 *
 * Executive Analytics Dashboard (Home Screen: `/`)
 *
 * Capabilities:
 *  1. Concurrent Data Loading: Uses Promise.all to fetch Products, Inventory,
 *     Competitors, and Price History in parallel for high-performance initialization.
 *  2. 4 Top Executive KPI StatCards:
 *     - Total Products in Catalog (GET /api/products)
 *     - Low Stock Alerts (GET /api/inventory -> items with LOW_STOCK)
 *     - Total Price Adjustments Logged (GET /api/pricing/history)
 *     - Tracked Competitor Feeds (GET /api/competitor-prices)
 *  3. Interactive Product-Specific Price Adjustment Trend Chart (Recharts):
 *     - Product Selector dropdown to isolate pricing history for one specific product.
 *     - Automatically defaults to the first available product.
 *     - Renders two separate curves: Base Catalog Price vs AI Recommended Price.
 *     - X-axis plots historical timestamps; Y-axis plots price in ₹.
 *     - Completely excludes records from other products; handles empty states cleanly.
 *  4. Inventory Stock Health Distribution Bar Chart (Low vs Normal vs High Stock).
 *  5. Recent Price Changes Audit Table: Chronological log of recent recommendations.
 *  6. 1-click shortcut to launch the Pricing Recommendation Engine.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';

// Recharts Visualizations
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  Cell,
} from 'recharts';

// Icons
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import ProductionQuantityLimitsRoundedIcon from '@mui/icons-material/ProductionQuantityLimitsRounded';
import AutoGraphRoundedIcon from '@mui/icons-material/AutoGraphRounded';
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';

// Common Components & API Client
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import { LoadingState, ErrorState, EmptyState } from '../components/common/LoadingState';
import { productsApi, inventoryApi, competitorApi, pricingApi } from '../api/client';

export default function Dashboard() {
  const navigate = useNavigate();

  // ─── 1. State Variables ─────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [competitors, setCompetitors] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected product specifically for the Dynamic Price Adjustments chart
  const [selectedChartProductId, setSelectedChartProductId] = useState('');

  // ─── 2. Data Fetching Function ──────────────────────────────────────────────

  /**
   * Purpose:
   *   Fetches all data required for the executive dashboard concurrently
   *   using Promise.all from the 4 backend API endpoints.
   *
   * When it executes:
   *   - Automatically on component mount (initial load).
   *   - When user clicks "Retry" on an error alert.
   *
   * Inputs:
   *   None
   *
   * What it updates or calls:
   *   - Calls: productsApi.getAll(), inventoryApi.getAll(), competitorApi.getAll(), pricingApi.getHistory()
   *   - Updates: `products`, `inventory`, `competitors`, `history`, `loading`, `error`
   *   - Sets: default `selectedChartProductId` to the first product in the catalog.
   */
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Execute all 4 HTTP GET requests concurrently in parallel
      const [productsRes, inventoryRes, competitorRes, historyRes] = await Promise.all([
        productsApi.getAll(),
        inventoryApi.getAll(),
        competitorApi.getAll(),
        pricingApi.getHistory(),
      ]);

      const productList = productsRes.data.data || [];
      setProducts(productList);
      setInventory(inventoryRes.data.data || []);
      setCompetitors(competitorRes.data.data || []);
      setHistory(historyRes.data.data || []);

      // By default, select the first available product for the price adjustment chart
      if (productList.length > 0) {
        setSelectedChartProductId((prev) => prev || productList[0]._id);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
      setError(err.message || 'Unable to connect to dynamic pricing backend services.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Keep selectedChartProductId updated if products load after initial render
  useEffect(() => {
    if (products.length > 0 && !selectedChartProductId) {
      setSelectedChartProductId(products[0]._id);
    }
  }, [products, selectedChartProductId]);

  // ─── 3. Computed Metrics & Chart Data Preparation ───────────────────────────

  /**
   * Purpose:
   *   Calculates summary metric counters for the 4 top StatCards.
   */
  const metrics = useMemo(() => {
    const lowStockCount = inventory.filter((item) => item.stockStatus === 'LOW_STOCK').length;
    return {
      totalProducts: products.length,
      lowStockAlerts: lowStockCount,
      totalAdjustments: history.length,
      trackedCompetitors: competitors.length,
    };
  }, [products, inventory, history, competitors]);

  /**
   * Purpose:
   *   Finds the product object currently selected in the chart dropdown.
   */
  const selectedProduct = useMemo(() => {
    return products.find((p) => String(p._id) === String(selectedChartProductId)) || null;
  }, [products, selectedChartProductId]);

  /**
   * Purpose:
   *   Prepares chronological price history data for the Recharts AreaChart,
   *   strictly filtered for the currently selected product.
   *
   * Rules enforced:
   *   - Completely excludes records from other products.
   *   - Handles both populated ({ _id: "..." }) and raw ObjectId product references.
   *   - Arranges entries in chronological order (oldest to newest) from left to right.
   *   - X-axis displays historical timestamps; Y-axis displays Base Price & Recommended Price.
   */
  const priceTrendChartData = useMemo(() => {
    if (!selectedChartProductId) return [];

    // 1. Strict filter: only include records that belong to the selected product
    const productSpecificHistory = history.filter((entry) => {
      const entryProdId =
        typeof entry.productId === 'object' && entry.productId !== null
          ? entry.productId._id
          : entry.productId;
      return String(entryProdId) === String(selectedChartProductId);
    });

    // 2. Sort chronologically (oldest first) so timeline flows from left to right
    const chronologicalHistory = [...productSpecificHistory].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    // 3. Format entries for Recharts with timestamp labels
    return chronologicalHistory.map((entry, index) => {
      const dateObj = new Date(entry.createdAt);
      const formattedTimestamp = !isNaN(dateObj.getTime())
        ? dateObj.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : `Adj #${index + 1}`;

      return {
        timestamp: formattedTimestamp,
        fullTime: !isNaN(dateObj.getTime()) ? dateObj.toLocaleString() : '',
        basePrice: Number(entry.oldPrice || 0),
        recommendedPrice: Number(entry.recommendedPrice || 0),
        reason: entry.reason || 'Dynamic Adjustment',
      };
    });
  }, [history, selectedChartProductId]);

  /**
   * Purpose:
   *   Prepares inventory distribution data for the Recharts BarChart.
   *   Categorizes products into Low Stock (<=10), Normal (11-99), and High Stock (>=100).
   */
  const stockDistributionData = useMemo(() => {
    let low = 0;
    let normal = 0;
    let high = 0;

    inventory.forEach((item) => {
      if (item.stockStatus === 'LOW_STOCK') low++;
      else if (item.stockStatus === 'HIGH_STOCK') high++;
      else normal++;
    });

    return [
      { status: 'Low Stock (≤10)', count: low, color: '#EF4444' },
      { status: 'Normal (11-99)', count: normal, color: '#22C55E' },
      { status: 'High Stock (≥100)', count: high, color: '#F59E0B' },
    ];
  }, [inventory]);

  return (
    <Box>
      {/* ── Page Header with Quick Demo Callout ──────────────────────────────── */}
      <PageHeader
        title="Executive Analytics Dashboard"
        subtitle="Live telemetry and market intelligence across products, warehouse stock, and dynamic pricing decisions."
        action={
          <Button
            variant="contained"
            color="primary"
            startIcon={<BoltRoundedIcon />}
            endIcon={<ArrowForwardRoundedIcon />}
            onClick={() => navigate('/pricing')}
            sx={{ px: 2.5, py: 1, fontWeight: 700 }}
          >
            Launch Pricing Engine
          </Button>
        }
      />

      {/* ── 4 Top KPI StatCards ──────────────────────────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {/* Total Products */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Catalog Products"
            value={metrics.totalProducts}
            subtitle="Managed in system"
            icon={<StorefrontRoundedIcon />}
            color="primary"
            loading={loading}
          />
        </Grid>

        {/* Low Stock Alerts */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Low Stock Scarcity Alerts"
            value={metrics.lowStockAlerts}
            subtitle="Triggers +10% Surge Rule"
            icon={<ProductionQuantityLimitsRoundedIcon />}
            color={metrics.lowStockAlerts > 0 ? 'error' : 'success'}
            loading={loading}
          />
        </Grid>

        {/* Total Price Adjustments Logged */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Price Adjustments Run"
            value={metrics.totalAdjustments}
            subtitle="AI Rationale Logged"
            icon={<AutoGraphRoundedIcon />}
            color="info"
            loading={loading}
          />
        </Grid>

        {/* Competitor Feeds */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Competitor Feeds Monitored"
            value={metrics.trackedCompetitors}
            subtitle="Amazon, Flipkart, etc."
            icon={<CompareArrowsRoundedIcon />}
            color="warning"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* ── Recharts Visualizations (Grid Layout) ────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Chart 1: Product-Specific Dynamic Price Adjustments */}
        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%', borderRadius: 3, border: '1px solid #E2E8F0' }}>
            <CardContent sx={{ p: 3 }}>
              {/* Chart Header + Product Dropdown Selector */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'space-between',
                  gap: 2,
                  mb: 2,
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    Dynamic Price Adjustments
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Historical trend of Base Catalog Price vs. AI Recommended Price
                  </Typography>
                </Box>

                {/* Product Selection Dropdown */}
                {products.length > 0 && (
                  <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 220 } }}>
                    <InputLabel id="chart-product-select-label">Select Product</InputLabel>
                    <Select
                      labelId="chart-product-select-label"
                      value={selectedChartProductId}
                      label="Select Product"
                      onChange={(e) => setSelectedChartProductId(e.target.value)}
                    >
                      {products.map((prod) => (
                        <MenuItem key={prod._id} value={prod._id}>
                          {prod.productName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Box>

              {loading ? (
                <LoadingState rows={4} cols={3} />
              ) : products.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No products available in the catalog.
                  </Typography>
                </Box>
              ) : priceTrendChartData.length === 0 ? (
                /* Empty state specific to the selected product */
                <Box
                  sx={{
                    py: 6,
                    px: 3,
                    textAlign: 'center',
                    backgroundColor: '#F8FAFC',
                    borderRadius: 2,
                    border: '1px dashed #E2E8F0',
                    my: 1,
                  }}
                >
                  <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600, mb: 0.5 }}>
                    No price adjustments recorded yet for "{selectedProduct?.productName || 'this product'}".
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                    Base Catalog Price: ₹{Number(selectedProduct?.currentPrice || 0).toFixed(2)}. Run a recommendation in the Pricing Engine to begin tracking historical adjustments.
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<BoltRoundedIcon />}
                    onClick={() => navigate('/pricing')}
                  >
                    Run Pricing for this Product
                  </Button>
                </Box>
              ) : (
                /* Recharts Area Chart displaying isolated history for the selected product */
                <Box sx={{ width: '100%', height: 260, mt: 2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={priceTrendChartData}
                      margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#94A3B8" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      {/* X-Axis: Historical Timestamps */}
                      <XAxis dataKey="timestamp" stroke="#94A3B8" fontSize={11} />
                      {/* Y-Axis: Currency Price in ₹ */}
                      <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={(val) => `₹${val}`} />
                      <RechartsTooltip
                        formatter={(value, name) => [
                          `₹${Number(value).toFixed(2)}`,
                          name === 'basePrice' ? 'Base Catalog Price' : 'AI Recommended Price',
                        ]}
                        labelFormatter={(label, payload) => {
                          const full = payload?.[0]?.payload?.fullTime;
                          return full ? `${label} (${full})` : label;
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      {/* Line 1: Base Catalog Price */}
                      <Area
                        type="monotone"
                        dataKey="basePrice"
                        name="Base Catalog Price"
                        stroke="#94A3B8"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorBase)"
                      />
                      {/* Line 2: AI Recommended Price */}
                      <Area
                        type="monotone"
                        dataKey="recommendedPrice"
                        name="AI Recommended Price"
                        stroke="#4F46E5"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorRec)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Chart 2: Inventory Health Distribution */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%', borderRadius: 3, border: '1px solid #E2E8F0' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    Warehouse Stock Health
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Rule Trigger Breakdown (Scarcity vs Normal vs Surplus)
                  </Typography>
                </Box>
                <Chip label="Inventory" size="small" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
              </Box>

              {loading ? (
                <LoadingState rows={4} cols={2} />
              ) : inventory.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No inventory records found.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ width: '100%', height: 260, mt: 2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stockDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="status" stroke="#94A3B8" fontSize={11} />
                      <YAxis stroke="#94A3B8" fontSize={11} allowDecimals={false} />
                      <RechartsTooltip />
                      <Bar dataKey="count" name="Products" radius={[6, 6, 0, 0]}>
                        {stockDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Recent Price Adjustments Audit Table ─────────────────────────────── */}
      <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0', mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 1.5,
              mb: 2.5,
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Recent Price Adjustments Audit Trail
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Chronological log of dynamic pricing recommendations persisted in MongoDB:
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              endIcon={<ArrowForwardRoundedIcon />}
              onClick={() => navigate('/pricing')}
            >
              Test New Calculation
            </Button>
          </Box>

          {loading ? (
            <LoadingState rows={4} cols={5} />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchDashboardData} />
          ) : history.length === 0 ? (
            <EmptyState
              icon={<AutoGraphRoundedIcon />}
              title="No Price Adjustments Logged Yet"
              message="The audit trail is currently empty. Run a calculation on the Pricing Recommendation page to generate your first log."
              action={
                <Button variant="contained" onClick={() => navigate('/pricing')}>
                  Go to Pricing Engine
                </Button>
              }
            />
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product Name</TableCell>
                    <TableCell>Catalog Base Price</TableCell>
                    <TableCell>Recommended Price</TableCell>
                    <TableCell>Adjustment Reason</TableCell>
                    <TableCell>Timestamp</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.slice(0, 6).map((record) => {
                    const product = record.productId || {};
                    const oldP = Number(record.oldPrice || 0);
                    const newP = Number(record.recommendedPrice || 0);
                    const diff = Number((newP - oldP).toFixed(2));
                    const isIncrease = diff > 0;
                    const isDecrease = diff < 0;

                    return (
                      <TableRow key={record._id} hover>
                        {/* Product Info */}
                        <TableCell>
                          <Typography sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.9375rem' }}>
                            {product.productName || 'Unassigned Product'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {product.category || 'General'}
                          </Typography>
                        </TableCell>

                        {/* Old Base Price */}
                        <TableCell>
                          <Typography sx={{ fontWeight: 600, color: 'text.secondary' }}>
                            ₹{oldP.toFixed(2)}
                          </Typography>
                        </TableCell>

                        {/* Recommended Price + Diff Chip */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontWeight: 800, color: 'text.primary' }}>
                              ₹{newP.toFixed(2)}
                            </Typography>
                            <Chip
                              label={isIncrease ? `+₹${diff}` : isDecrease ? `₹${diff}` : '₹0.00'}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                backgroundColor: isIncrease ? '#DCFCE7' : isDecrease ? '#FEE2E2' : '#F1F5F9',
                                color: isIncrease ? '#166534' : isDecrease ? '#B91C1C' : 'text.secondary',
                              }}
                            />
                          </Box>
                        </TableCell>

                        {/* Reason Summary with AI tooltip */}
                        <TableCell>
                          <Tooltip title={record.aiExplanation || 'AI Explanation logged'} arrow>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 500,
                                color: 'text.primary',
                                maxWidth: 280,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                cursor: 'help',
                              }}
                            >
                              {record.reason}
                            </Typography>
                          </Tooltip>
                        </TableCell>

                        {/* Timestamp */}
                        <TableCell>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {new Date(record.createdAt).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
