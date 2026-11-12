/**
 * src/pages/Inventory.jsx
 *
 * Inventory Management Page
 *
 * Capabilities:
 *  1. Fetches all inventory records populated with product details via GET /api/inventory
 *  2. Evaluates stock statuses based on project rules:
 *     - LOW_STOCK   (<= 10 units)  -> Red badge (Triggers +10% Surge Rule)
 *     - NORMAL_STOCK (11 - 99 units)-> Green badge (Stable price)
 *     - HIGH_STOCK  (>= 100 units) -> Amber badge (Triggers -10% Clearance Rule)
 *  3. Displays 3 top KPI StatCards: Total Units, Low Stock Alerts, Surplus Stock
 *  4. Quick filter tabs (All, Low Stock, Normal, High Stock) + In-memory search bar
 *  5. "Update Stock" Modal -> PUT /api/inventory/:id
 *  6. "Initialize Stock" Modal -> POST /api/inventory (for newly added products)
 *  7. Full error handling, loading skeleton, and toast notifications
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
  Tabs,
  Tab,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  LinearProgress,
} from '@mui/material';

// Icons
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import ProductionQuantityLimitsRoundedIcon from '@mui/icons-material/ProductionQuantityLimitsRounded';

// Common Components & API Client
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import { LoadingState, EmptyState, ErrorState } from '../components/common/LoadingState';
import { useToast } from '../components/common/ToastProvider';
import { inventoryApi, productsApi } from '../api/client';

export default function Inventory() {
  const { showToast } = useToast();

  // ─── 1. State Variables ─────────────────────────────────────────────────────
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]); // Used for "Add Stock Record" dropdown
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [selectedTab, setSelectedTab] = useState('ALL'); // 'ALL' | 'LOW_STOCK' | 'NORMAL_STOCK' | 'HIGH_STOCK'
  const [searchQuery, setSearchQuery] = useState('');

  // Update Stock Modal State
  const [editItem, setEditItem] = useState(null); // Inventory document being edited
  const [editQuantity, setEditQuantity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Initial Inventory Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [initialQuantity, setInitialQuantity] = useState('50');

  // ─── 2. Data Fetching Functions ─────────────────────────────────────────────

  /**
   * Purpose:
   *   Fetches all inventory records from the backend database with populated
   *   product details (name, category, currentPrice) and stock status.
   *
   * When it executes:
   *   - Automatically on component mount (first page load)
   *   - After updating stock count (to reflect updated values)
   *   - After initializing a new stock record
   *
   * Inputs:
   *   None (uses current component scope)
   *
   * What it updates or calls:
   *   - Calls: inventoryApi.getAll() -> GET /api/inventory
   *   - Updates: `inventory` state array with backend documents
   *   - Updates: `loading` (true while fetching, false when done)
   *   - Updates: `error` (sets error message if network request fails)
   */
  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await inventoryApi.getAll();
      setInventory(res.data.data || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError(err.message || 'Failed to connect to inventory service.');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Purpose:
   *   Fetches the list of all products from the catalog to determine which
   *   products do not yet have an inventory record assigned to them.
   *
   * When it executes:
   *   - On component mount via useEffect
   *
   * Inputs:
   *   None
   *
   * What it updates or calls:
   *   - Calls: productsApi.getAll() -> GET /api/products
   *   - Updates: `products` state array
   */
  const fetchProducts = useCallback(async () => {
    try {
      const res = await productsApi.getAll();
      setProducts(res.data.data || []);
    } catch (err) {
      console.error('Failed to load products for inventory mapping:', err);
    }
  }, []);

  // Fetch initial data on page load
  useEffect(() => {
    fetchInventory();
    fetchProducts();
  }, [fetchInventory, fetchProducts]);

  // ─── 3. Computed Metrics & Filter Logic ─────────────────────────────────────

  /**
   * Purpose:
   *   Calculates aggregate summary numbers for the top 3 KPI cards.
   *
   * When it executes:
   *   - Whenever the `inventory` state changes.
   *
   * Outputs:
   *   Object containing:
   *   - totalUnits: sum of all available quantities
   *   - lowStockCount: items with availableQuantity <= 10
   *   - highStockCount: items with availableQuantity >= 100
   *   - normalStockCount: items with availableQuantity between 11 and 99
   */
  const metrics = useMemo(() => {
    const totalUnits = inventory.reduce((sum, item) => sum + (Number(item.availableQuantity) || 0), 0);
    const lowStockCount = inventory.filter((item) => item.stockStatus === 'LOW_STOCK').length;
    const highStockCount = inventory.filter((item) => item.stockStatus === 'HIGH_STOCK').length;
    const normalStockCount = inventory.filter((item) => item.stockStatus === 'NORMAL_STOCK').length;

    return { totalUnits, lowStockCount, highStockCount, normalStockCount };
  }, [inventory]);

  /**
   * Purpose:
   *   Filters the product catalog to find items that have no inventory document.
   *   Ensures users can only create stock records for products that need one.
   *
   * When it executes:
   *   - Recalculates whenever `products` or `inventory` updates.
   */
  const productsWithoutInventory = useMemo(() => {
    const existingProductIds = new Set(
      inventory.map((item) => (typeof item.productId === 'object' ? item.productId?._id : item.productId))
    );
    return products.filter((prod) => !existingProductIds.has(prod._id));
  }, [products, inventory]);

  /**
   * Purpose:
   *   Applies the active tab filter ('ALL', 'LOW_STOCK', 'NORMAL_STOCK', 'HIGH_STOCK')
   *   and the user's search text query (matching product name or category).
   *
   * When it executes:
   *   - Recalculates whenever `inventory`, `selectedTab`, or `searchQuery` changes.
   */
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      // 1. Tab Status Filter
      if (selectedTab !== 'ALL' && item.stockStatus !== selectedTab) {
        return false;
      }

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const productName = item.productId?.productName?.toLowerCase() || '';
        const category = item.productId?.category?.toLowerCase() || '';
        return productName.includes(query) || category.includes(query);
      }

      return true;
    });
  }, [inventory, selectedTab, searchQuery]);

  // ─── 4. Event Handlers ──────────────────────────────────────────────────────

  /**
   * Purpose:
   *   Opens the "Update Stock" modal and populates the text field with
   *   the current quantity of the clicked product.
   *
   * When it executes:
   *   - User clicks the "Update" button on any table row.
   *
   * Inputs:
   *   {Object} item - The inventory document object clicked.
   *
   * What it updates or calls:
   *   - Updates: `editItem` with the clicked row object (opens modal).
   *   - Updates: `editQuantity` with item.availableQuantity as a string.
   */
  const handleOpenEdit = (item) => {
    setEditItem(item);
    setEditQuantity(String(item.availableQuantity));
  };

  /**
   * Purpose:
   *   Sends an HTTP PUT request to update available stock count in MongoDB.
   *
   * When it executes:
   *   - User clicks "Save Stock" inside the "Update Stock" dialog.
   *
   * Inputs:
   *   {Event} e - Form submission event.
   *
   * What it updates or calls:
   *   - Validates: quantity is a non-negative number.
   *   - Calls: inventoryApi.updateStock(editItem._id, { availableQuantity })
   *   - Updates: Database record in MongoDB.
   *   - Updates: Closes dialog (`setEditItem(null)`), shows Toast, calls `fetchInventory()`.
   */
  const handleUpdateStock = async (e) => {
    e.preventDefault();
    if (!editItem) return;

    const parsedQty = Number(editQuantity);
    if (isNaN(parsedQty) || parsedQty < 0) {
      showToast('Quantity must be a non-negative number.', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      await inventoryApi.updateStock(editItem._id, { availableQuantity: parsedQty });

      showToast('Stock quantity updated successfully!', 'success');
      setEditItem(null);
      fetchInventory(); // Pull fresh data from MongoDB
    } catch (err) {
      showToast(err.message || 'Failed to update stock quantity.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Purpose:
   *   Helper to quickly increment or decrement the quantity in the edit modal
   *   without manually typing (e.g. clicking +10, -5).
   *
   * When it executes:
   *   - User clicks one of the quick adjustment buttons in the dialog.
   *
   * Inputs:
   *   {number} delta - The integer to add or subtract (-10, -5, +5, +10).
   *
   * What it updates or calls:
   *   - Updates: `editQuantity` state, ensuring it never goes below 0.
   */
  const handleQuickStep = (delta) => {
    setEditQuantity((prev) => {
      const current = Number(prev) || 0;
      return String(Math.max(0, current + delta));
    });
  };

  /**
   * Purpose:
   *   Creates a new inventory tracking record in MongoDB for a product
   *   that doesn't have one yet.
   *
   * When it executes:
   *   - User submits the "Initialize Stock for Product" form.
   *
   * Inputs:
   *   {Event} e - Form submission event.
   *
   * What it updates or calls:
   *   - Calls: inventoryApi.create({ productId, availableQuantity })
   *   - Updates: Inserts new document into MongoDB `inventories` collection.
   *   - Updates: Closes modal (`setIsAddOpen(false)`), shows Toast, refreshes inventory.
   */
  const handleCreateInventory = async (e) => {
    e.preventDefault();
    if (!selectedProductId) {
      showToast('Please select a product to initialize stock for.', 'warning');
      return;
    }

    const qty = Number(initialQuantity);
    if (isNaN(qty) || qty < 0) {
      showToast('Initial quantity cannot be negative.', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      await inventoryApi.create({
        productId: selectedProductId,
        availableQuantity: qty,
      });

      showToast('Inventory record created successfully!', 'success');
      setIsAddOpen(false);
      setSelectedProductId('');
      setInitialQuantity('50');
      fetchInventory();
    } catch (err) {
      showToast(err.message || 'Failed to create inventory record.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <PageHeader
        title="Inventory Management"
        subtitle="Monitor warehouse stock counts, track scarcity thresholds, and supply pricing engine inputs."
        action={
          productsWithoutInventory.length > 0 && (
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={() => setIsAddOpen(true)}
              sx={{ px: 2.5 }}
            >
              Add Stock Record
            </Button>
          )
        }
      />

      {/* ── 3 Top KPI Stat Cards ─────────────────────────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {/* Total Warehouse Units */}
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Total Warehouse Units"
            value={metrics.totalUnits.toLocaleString()}
            subtitle={`Across ${inventory.length} tracked items`}
            icon={<Inventory2RoundedIcon />}
            color="primary"
            loading={loading}
          />
        </Grid>

        {/* Low Stock Alerts */}
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Low Stock Alerts"
            value={metrics.lowStockCount}
            subtitle="<= 10 units (Triggers +10% Surge Rule)"
            icon={<ProductionQuantityLimitsRoundedIcon />}
            color={metrics.lowStockCount > 0 ? 'error' : 'success'}
            loading={loading}
          />
        </Grid>

        {/* Surplus Stock Items */}
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Surplus Stock Items"
            value={metrics.highStockCount}
            subtitle=">= 100 units (Triggers -10% Clearance Rule)"
            icon={<TrendingUpRoundedIcon />}
            color={metrics.highStockCount > 0 ? 'warning' : 'info'}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* ── Filter Tabs & Search Bar ─────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', md: 'center' },
          gap: 2,
          mb: 3,
        }}
      >
        {/* Filter Tabs */}
        <Tabs
          value={selectedTab}
          onChange={(_, newTab) => setSelectedTab(newTab)}
          sx={{
            minHeight: 40,
            '& .MuiTab-root': {
              minHeight: 40,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              px: 2,
            },
          }}
        >
          <Tab label={`All Items (${inventory.length})`} value="ALL" />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <span>Low Stock</span>
                {metrics.lowStockCount > 0 && (
                  <Chip
                    label={metrics.lowStockCount}
                    size="small"
                    sx={{ height: 20, fontSize: '0.7rem', backgroundColor: '#FEE2E2', color: '#B91C1C' }}
                  />
                )}
              </Box>
            }
            value="LOW_STOCK"
          />
          <Tab label={`Normal (${metrics.normalStockCount})`} value="NORMAL_STOCK" />
          <Tab label={`High Stock (${metrics.highStockCount})`} value="HIGH_STOCK" />
        </Tabs>

        {/* Search Input */}
        <TextField
          placeholder="Search inventory by product..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ maxWidth: { xs: '100%', md: 320 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* ── Inventory Data Table Card ────────────────────────────────────────── */}
      <Card>
        {loading ? (
          <LoadingState rows={5} cols={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchInventory} />
        ) : filteredInventory.length === 0 ? (
          <EmptyState
            icon={<Inventory2RoundedIcon />}
            title={searchQuery || selectedTab !== 'ALL' ? 'No Matching Inventory' : 'No Inventory Initialized'}
            message={
              searchQuery
                ? `No inventory item matches "${searchQuery}".`
                : selectedTab !== 'ALL'
                ? `No items currently match the "${selectedTab.replace('_', ' ')}" filter.`
                : 'No inventory records found. Click "Add Stock Record" above to initialize stock for your catalog.'
            }
            action={
              !searchQuery && selectedTab === 'ALL' && productsWithoutInventory.length > 0 && (
                <Button
                  variant="outlined"
                  startIcon={<AddRoundedIcon />}
                  onClick={() => setIsAddOpen(true)}
                >
                  Initialize First Product Stock
                </Button>
              )
            }
          />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product Details</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Base Price</TableCell>
                  <TableCell sx={{ minWidth: 200 }}>Available Quantity</TableCell>
                  <TableCell align="center">Stock Status</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInventory.map((item) => {
                  const product = item.productId || {};
                  const qty = Number(item.availableQuantity) || 0;

                  // Visual Stock Bar percent (capped at 100 for gauge visualization)
                  const progressValue = Math.min(100, (qty / 100) * 100);
                  const progressColor =
                    item.stockStatus === 'LOW_STOCK'
                      ? 'error'
                      : item.stockStatus === 'HIGH_STOCK'
                      ? 'warning'
                      : 'success';

                  return (
                    <TableRow key={item._id} hover>
                      {/* Product Name & ID */}
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.9375rem' }}>
                          {product.productName || 'Unassigned Product'}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: 'text.secondary', fontFamily: 'monospace' }}
                        >
                          ID: {product._id ? product._id.slice(-6) : 'N/A'}
                        </Typography>
                      </TableCell>

                      {/* Category Chip */}
                      <TableCell>
                        <Chip
                          label={product.category || 'General'}
                          size="small"
                          sx={{
                            backgroundColor: '#EEF2FF',
                            color: '#4F46E5',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                          }}
                        />
                      </TableCell>

                      {/* Base Price */}
                      <TableCell align="right">
                        <Typography sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.9375rem' }}>
                          ₹{Number(product.currentPrice || 0).toFixed(2)}
                        </Typography>
                      </TableCell>

                      {/* Stock Quantity + Visual Capacity Bar */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: 'text.primary' }}>
                            {qty}{' '}
                            <Box component="span" sx={{ fontSize: '0.75rem', fontWeight: 500, color: 'text.secondary' }}>
                              units
                            </Box>
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {item.stockStatus === 'LOW_STOCK'
                              ? 'Scarcity zone'
                              : item.stockStatus === 'HIGH_STOCK'
                              ? 'Surplus zone'
                              : 'Healthy'}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={progressValue}
                          color={progressColor}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </TableCell>

                      {/* Stock Status Badge */}
                      <TableCell align="center">
                        <StatusBadge status={item.stockStatus} />
                      </TableCell>

                      {/* Edit Quantity Button */}
                      <TableCell align="center">
                        <Tooltip title="Update Stock Quantity" arrow>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<EditRoundedIcon sx={{ fontSize: 16 }} />}
                            onClick={() => handleOpenEdit(item)}
                            sx={{
                              fontSize: '0.8125rem',
                              px: 1.5,
                              py: 0.5,
                            }}
                          >
                            Update
                          </Button>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* ── Dialog: Update Stock Quantity ────────────────────────────────────── */}
      <Dialog
        open={Boolean(editItem)}
        onClose={() => !isSubmitting && setEditItem(null)}
        maxWidth="xs"
        fullWidth
      >
        <form onSubmit={handleUpdateStock}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            Update Stock Quantity
          </DialogTitle>
          <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Product:{' '}
              <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {editItem?.productId?.productName}
              </Box>
            </Typography>

            {/* Quantity Input */}
            <TextField
              label="Available Quantity (units)"
              type="number"
              inputProps={{ min: 0, step: 1 }}
              fullWidth
              required
              value={editQuantity}
              onChange={(e) => setEditQuantity(e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />

            {/* Quick Adjustment Increment Buttons */}
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1, fontWeight: 600 }}>
                Quick Adjustments:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" variant="outlined" onClick={() => handleQuickStep(-10)} disabled={isSubmitting}>
                  -10
                </Button>
                <Button size="small" variant="outlined" onClick={() => handleQuickStep(-5)} disabled={isSubmitting}>
                  -5
                </Button>
                <Button size="small" variant="outlined" onClick={() => handleQuickStep(+5)} disabled={isSubmitting}>
                  +5
                </Button>
                <Button size="small" variant="outlined" onClick={() => handleQuickStep(+10)} disabled={isSubmitting}>
                  +10
                </Button>
              </Box>
            </Box>

            {/* Dynamic Rule Engine Impact Preview */}
            {(() => {
              const q = Number(editQuantity);
              if (isNaN(q)) return null;
              if (q <= 10) {
                return (
                  <Box sx={{ p: 1.5, backgroundColor: '#FEE2E2', borderRadius: 2 }}>
                    <Typography sx={{ fontSize: '0.75rem', color: '#B91C1C', fontWeight: 600 }}>
                      ⚠️ At ≤10 units, this product enters LOW_STOCK and triggers the +10% Scarcity Surge rule.
                    </Typography>
                  </Box>
                );
              }
              if (q >= 100) {
                return (
                  <Box sx={{ p: 1.5, backgroundColor: '#FEF3C7', borderRadius: 2 }}>
                    <Typography sx={{ fontSize: '0.75rem', color: '#92400E', fontWeight: 600 }}>
                      📦 At ≥100 units, this product enters HIGH_STOCK and triggers the -10% Clearance rule.
                    </Typography>
                  </Box>
                );
              }
              return (
                <Box sx={{ p: 1.5, backgroundColor: '#DCFCE7', borderRadius: 2 }}>
                  <Typography sx={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>
                    ✅ Quantity is in the NORMAL_STOCK range (11 - 99 units).
                  </Typography>
                </Box>
              );
            })()}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setEditItem(null)} disabled={isSubmitting} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {isSubmitting ? 'Saving...' : 'Save Stock'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── Dialog: Add Initial Stock Record ─────────────────────────────────── */}
      <Dialog
        open={isAddOpen}
        onClose={() => !isSubmitting && setIsAddOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleCreateInventory}>
          <DialogTitle sx={{ fontWeight: 700 }}>Initialize Stock for Product</DialogTitle>
          <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Typography variant="body2" color="text.secondary">
              Select an existing product from your catalog to create its initial inventory tracking record.
            </Typography>

            {/* Product Dropdown Selector */}
            <FormControl fullWidth required size="small">
              <InputLabel id="select-product-label">Select Product</InputLabel>
              <Select
                labelId="select-product-label"
                value={selectedProductId}
                label="Select Product"
                onChange={(e) => setSelectedProductId(e.target.value)}
                disabled={isSubmitting}
              >
                {productsWithoutInventory.map((prod) => (
                  <MenuItem key={prod._id} value={prod._id}>
                    {prod.productName} ({prod.category} — ₹{prod.currentPrice})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Initial Quantity Field */}
            <TextField
              label="Initial Available Quantity"
              type="number"
              inputProps={{ min: 0, step: 1 }}
              fullWidth
              required
              value={initialQuantity}
              onChange={(e) => setInitialQuantity(e.target.value)}
              disabled={isSubmitting}
              helperText="Default recommended baseline is 50 units (Normal Stock)"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setIsAddOpen(false)} disabled={isSubmitting} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {isSubmitting ? 'Initializing...' : 'Add Record'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
