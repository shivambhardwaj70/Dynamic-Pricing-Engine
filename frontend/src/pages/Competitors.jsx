/**
 * src/pages/Competitors.jsx
 *
 * Competitor Pricing & Market Intelligence Page
 *
 * Capabilities:
 *  1. Fetches all competitor price feeds via GET /api/competitor-prices
 *  2. Interactive Price Comparison Card via GET /api/competitor-prices/compare/:productId
 *     - Displays Lowest, Highest, and Average Competitor Price
 *     - Identifies Rule 3 (Competitor Under-Cut: -5%) and Rule 4 (Premium: +3%) triggers
 *  3. "Add Competitor Price" Modal -> POST /api/competitor-prices
 *  4. "Edit Competitor Price" Modal -> PUT /api/competitor-prices/:id
 *  5. Search filtering by product name or competitor platform
 *  6. 3 Top KPI Stat Cards summarizing market intelligence
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
} from '@mui/material';

// Icons
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import ShoppingBagRoundedIcon from '@mui/icons-material/ShoppingBagRounded';

// Common Components & API Client
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import { LoadingState, EmptyState, ErrorState } from '../components/common/LoadingState';
import { useToast } from '../components/common/ToastProvider';
import { competitorApi, productsApi } from '../api/client';

// Preset popular competitor platforms for quick selection
const PRESET_COMPETITORS = ['Amazon', 'Flipkart', 'Reliance Digital', 'Croma', 'Tata CLiQ'];

export default function Competitors() {
  const { showToast } = useToast();

  // ─── 1. State Variables ─────────────────────────────────────────────────────
  const [competitorFeeds, setCompetitorFeeds] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive Comparison Section State
  const [comparisonProductId, setComparisonProductId] = useState('');
  const [comparisonData, setComparisonData] = useState(null);
  const [isComparing, setIsComparing] = useState(false);

  // Add Competitor Price Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    productId: '',
    competitorName: 'Amazon',
    competitorPrice: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Competitor Price Modal State
  const [editItem, setEditItem] = useState(null); // Competitor document being edited
  const [editPrice, setEditPrice] = useState('');

  // ─── 2. Data Fetching Functions ─────────────────────────────────────────────

  /**
   * Purpose:
   *   Fetches all competitor pricing records from MongoDB, populated with product info.
   *
   * When it executes:
   *   - Automatically on component mount (initial load)
   *   - After adding or editing any competitor price
   *
   * Inputs:
   *   None
   *
   * What it updates or calls:
   *   - Calls: competitorApi.getAll() -> GET /api/competitor-prices
   *   - Updates: `competitorFeeds`, `loading`, `error`
   */
  const fetchCompetitorFeeds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await competitorApi.getAll();
      setCompetitorFeeds(res.data.data || []);
    } catch (err) {
      console.error('Failed to load competitor feeds:', err);
      setError(err.message || 'Unable to connect to competitor pricing service.');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Purpose:
   *   Fetches all products from the catalog to populate dropdown menus
   *   in the "Compare Product" selector and the "Add Competitor Feed" dialog.
   *
   * When it executes:
   *   - On component mount via useEffect.
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
      const productList = res.data.data || [];
      setProducts(productList);

      // Default the comparison dropdown to the first product if available
      if (productList.length > 0 && !comparisonProductId) {
        setComparisonProductId(productList[0]._id);
      }
    } catch (err) {
      console.error('Failed to load products list:', err);
    }
  }, [comparisonProductId]);

  /**
   * Purpose:
   *   Calls backend comparison endpoint for a specific product to determine
   *   lowest price, highest price, price difference, and Rule 3/Rule 4 triggers.
   *
   * When it executes:
   *   - When `comparisonProductId` changes (user selects a product in dropdown)
   *   - After adding or editing a competitor price for the selected product
   *
   * Inputs:
   *   {string} productId - MongoDB _id of the product to compare
   *
   * What it updates or calls:
   *   - Calls: competitorApi.compare(productId) -> GET /api/competitor-prices/compare/:productId
   *   - Updates: `comparisonData` state and `isComparing` indicator
   */
  const fetchPriceComparison = useCallback(async (productId) => {
    if (!productId) {
      setComparisonData(null);
      return;
    }

    try {
      setIsComparing(true);
      const res = await competitorApi.compare(productId);
      setComparisonData(res.data.data || null);
    } catch (err) {
      console.error('Failed to fetch price comparison:', err);
      setComparisonData(null);
    } finally {
      setIsComparing(false);
    }
  }, []);

  // Fetch initial feeds and product list on mount
  useEffect(() => {
    fetchCompetitorFeeds();
    fetchProducts();
  }, [fetchCompetitorFeeds, fetchProducts]);

  // Trigger comparison calculation whenever the selected product changes
  useEffect(() => {
    if (comparisonProductId) {
      fetchPriceComparison(comparisonProductId);
    }
  }, [comparisonProductId, fetchPriceComparison]);

  // ─── 3. Computed Metrics & Search Filtering ─────────────────────────────────

  /**
   * Purpose:
   *   Calculates summary metrics for the top 3 KPI cards:
   *   - totalFeeds: Count of all competitor listings
   *   - underCutCount: Competitor feeds cheaper than our product base price (Rule 3)
   *   - premiumCount: Competitor feeds higher than our product base price (Rule 4)
   */
  const metrics = useMemo(() => {
    let underCutCount = 0;
    let premiumCount = 0;

    competitorFeeds.forEach((feed) => {
      const ourPrice = feed.productId?.currentPrice;
      if (ourPrice !== undefined) {
        if (feed.competitorPrice < ourPrice) underCutCount++;
        else if (feed.competitorPrice > ourPrice) premiumCount++;
      }
    });

    return {
      totalFeeds: competitorFeeds.length,
      underCutCount,
      premiumCount,
    };
  }, [competitorFeeds]);

  /**
   * Purpose:
   *   Filters the competitor feeds table by product name, category, or competitor platform name.
   */
  const filteredFeeds = useMemo(() => {
    if (!searchQuery.trim()) return competitorFeeds;
    const query = searchQuery.toLowerCase();
    return competitorFeeds.filter((feed) => {
      const productName = feed.productId?.productName?.toLowerCase() || '';
      const competitorName = feed.competitorName?.toLowerCase() || '';
      return productName.includes(query) || competitorName.includes(query);
    });
  }, [competitorFeeds, searchQuery]);

  // ─── 4. Event Handlers ──────────────────────────────────────────────────────

  /**
   * Purpose:
   *   Submits a new or updated competitor price entry to MongoDB.
   *
   * When it executes:
   *   - User submits the "Add Competitor Feed" modal form.
   *
   * Inputs:
   *   {Event} e - Form submission event
   *
   * What it updates or calls:
   *   - Calls: competitorApi.create({ productId, competitorName, competitorPrice })
   *   - Updates: Database via POST /api/competitor-prices
   *   - Updates: Closes modal, shows toast, refreshes table & active comparison card
   */
  const handleCreateCompetitorPrice = async (e) => {
    e.preventDefault();
    if (!addForm.productId || !addForm.competitorName || !addForm.competitorPrice) {
      showToast('Please fill in all competitor price fields.', 'warning');
      return;
    }

    const price = Number(addForm.competitorPrice);
    if (isNaN(price) || price < 0) {
      showToast('Competitor price must be a valid positive number.', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      await competitorApi.create({
        productId: addForm.productId,
        competitorName: addForm.competitorName.trim(),
        competitorPrice: price,
      });

      showToast(`Competitor price recorded for ${addForm.competitorName}!`, 'success');
      setIsAddOpen(false);
      setAddForm({ productId: '', competitorName: 'Amazon', competitorPrice: '' });
      fetchCompetitorFeeds();

      // If we just added a price for the currently viewed comparison product, refresh it
      if (comparisonProductId === addForm.productId) {
        fetchPriceComparison(addForm.productId);
      }
    } catch (err) {
      showToast(err.message || 'Failed to save competitor price.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Purpose:
   *   Opens the edit modal for a specific competitor feed entry.
   *
   * Inputs:
   *   {Object} feed - Competitor price record object.
   */
  const handleOpenEdit = (feed) => {
    setEditItem(feed);
    setEditPrice(String(feed.competitorPrice));
  };

  /**
   * Purpose:
   *   Submits an updated competitor price by its record ID.
   *
   * When it executes:
   *   - User clicks "Save Changes" in the edit modal.
   *
   * Inputs:
   *   {Event} e - Form submission event
   *
   * What it updates or calls:
   *   - Calls: competitorApi.update(editItem._id, { competitorPrice })
   *   - Updates: PUT /api/competitor-prices/:id
   *   - Updates: Closes modal, shows toast, refreshes feeds & comparison card
   */
  const handleUpdateCompetitorPrice = async (e) => {
    e.preventDefault();
    if (!editItem) return;

    const price = Number(editPrice);
    if (isNaN(price) || price < 0) {
      showToast('Price must be a valid non-negative number.', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      await competitorApi.update(editItem._id, {
        competitorName: editItem.competitorName,
        competitorPrice: price,
      });

      showToast('Competitor price updated successfully!', 'success');
      setEditItem(null);
      fetchCompetitorFeeds();

      // Refresh comparison card if this belongs to the selected product
      if (comparisonProductId === editItem.productId?._id) {
        fetchPriceComparison(comparisonProductId);
      }
    } catch (err) {
      showToast(err.message || 'Failed to update competitor price.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <PageHeader
        title="Competitor Pricing & Market Intelligence"
        subtitle="Track live competitor price feeds, evaluate market differences, and trigger pricing rules."
        action={
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => setIsAddOpen(true)}
            sx={{ px: 2.5 }}
          >
            Add Competitor Feed
          </Button>
        }
      />

      {/* ── 3 Top KPI Stat Cards ─────────────────────────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {/* Total Feeds */}
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Total Market Feeds"
            value={metrics.totalFeeds}
            subtitle="Competitor prices actively monitored"
            icon={<ShoppingBagRoundedIcon />}
            color="primary"
            loading={loading}
          />
        </Grid>

        {/* Competitor Under-Cut (Rule 3 Trigger) */}
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Competitor Under-Cuts"
            value={metrics.underCutCount}
            subtitle="Cheaper than us (Triggers Rule 3: -5%)"
            icon={<TrendingDownRoundedIcon />}
            color={metrics.underCutCount > 0 ? 'error' : 'success'}
            loading={loading}
          />
        </Grid>

        {/* Competitor Premium (Rule 4 Trigger) */}
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Premium Margin Wins"
            value={metrics.premiumCount}
            subtitle="Competitors pricier (Triggers Rule 4: +3%)"
            icon={<TrendingUpRoundedIcon />}
            color={metrics.premiumCount > 0 ? 'success' : 'info'}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* ── Interactive Live Price Comparison Card ───────────────────────────── */}
      <Card sx={{ mb: 4, border: '1px solid #E2E8F0', borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', md: 'center' },
              gap: 2,
              mb: 2.5,
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CompareArrowsRoundedIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  Live Market Price Comparison
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Select a product to compare our selling price against all registered market competitors.
              </Typography>
            </Box>

            {/* Product Selector Dropdown */}
            <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 280 } }}>
              <InputLabel id="compare-product-select-label">Select Product to Compare</InputLabel>
              <Select
                labelId="compare-product-select-label"
                value={comparisonProductId}
                label="Select Product to Compare"
                onChange={(e) => setComparisonProductId(e.target.value)}
              >
                {products.map((prod) => (
                  <MenuItem key={prod._id} value={prod._id}>
                    {prod.productName} (₹{prod.currentPrice})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Comparison Result Display */}
          {isComparing ? (
            <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={32} />
            </Box>
          ) : !comparisonData || comparisonData.comparisonStatus === 'NO_COMPETITOR_DATA' ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                No competitor prices recorded for this product yet.
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.disabled', mt: 0.5 }}>
                Click "Add Competitor Feed" above to register prices from Amazon, Flipkart, etc.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3} alignItems="center">
              {/* Our Price vs Lowest Competitor */}
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2, backgroundColor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    OUR BASE PRICE
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>
                    ₹{Number(comparisonData.product.ourPrice).toFixed(2)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {comparisonData.product.productName}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2, backgroundColor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    LOWEST MARKET PRICE
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', mt: 0.5 }}>
                    ₹{Number(comparisonData.lowestCompetitorPrice).toFixed(2)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Across {comparisonData.competitorCount} competitor feed(s)
                  </Typography>
                </Box>
              </Grid>

              {/* Difference & Rule Impact */}
              <Grid item xs={12} md={4}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor:
                      comparisonData.comparisonStatus === 'COMPETITOR_IS_CHEAPER'
                        ? '#FEE2E2'
                        : comparisonData.comparisonStatus === 'COMPETITOR_IS_MORE_EXPENSIVE'
                        ? '#DCFCE7'
                        : '#F1F5F9',
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                    PRICE DIFFERENCE & RULE TRIGGER
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      mt: 0.5,
                      color:
                        comparisonData.comparisonStatus === 'COMPETITOR_IS_CHEAPER'
                          ? '#B91C1C'
                          : comparisonData.comparisonStatus === 'COMPETITOR_IS_MORE_EXPENSIVE'
                          ? '#166534'
                          : 'text.primary',
                    }}
                  >
                    {comparisonData.priceDifference > 0 ? `+₹${comparisonData.priceDifference}` : `₹${comparisonData.priceDifference}`}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color:
                        comparisonData.comparisonStatus === 'COMPETITOR_IS_CHEAPER'
                          ? '#B91C1C'
                          : comparisonData.comparisonStatus === 'COMPETITOR_IS_MORE_EXPENSIVE'
                          ? '#166534'
                          : 'text.secondary',
                      mt: 0.5,
                    }}
                  >
                    {comparisonData.comparisonStatus === 'COMPETITOR_IS_CHEAPER'
                      ? '⚠️ Competitor is Cheaper -> Triggers Rule 3 (-5% Price Defense)'
                      : comparisonData.comparisonStatus === 'COMPETITOR_IS_MORE_EXPENSIVE'
                      ? '🚀 Competitor is Pricier -> Triggers Rule 4 (+3% Margin Win)'
                      : 'Equilibrium (Prices Match)'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* ── Search Bar & Table Header ────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          mb: 3,
        }}
      >
        <TextField
          placeholder="Search feeds by product or competitor..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ maxWidth: { xs: '100%', sm: 360 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />

        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
          Showing{' '}
          <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>
            {filteredFeeds.length}
          </Box>{' '}
          of {competitorFeeds.length} competitor feed(s)
        </Typography>
      </Box>

      {/* ── Competitor Feeds Table Card ──────────────────────────────────────── */}
      <Card>
        {loading ? (
          <LoadingState rows={5} cols={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchCompetitorFeeds} />
        ) : filteredFeeds.length === 0 ? (
          <EmptyState
            icon={<CompareArrowsRoundedIcon />}
            title={searchQuery ? 'No Matching Feeds' : 'No Competitor Feeds Recorded'}
            message={
              searchQuery
                ? `No competitor feed matches "${searchQuery}".`
                : 'No competitor prices registered yet. Click "Add Competitor Feed" above to start tracking market competitors.'
            }
            action={
              !searchQuery && (
                <Button
                  variant="outlined"
                  startIcon={<AddRoundedIcon />}
                  onClick={() => setIsAddOpen(true)}
                >
                  Record First Competitor Price
                </Button>
              )
            }
          />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product Name</TableCell>
                  <TableCell>Our Base Price</TableCell>
                  <TableCell>Competitor Platform</TableCell>
                  <TableCell align="right">Competitor Price</TableCell>
                  <TableCell align="center">Price Position</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFeeds.map((feed) => {
                  const product = feed.productId || {};
                  const ourPrice = product.currentPrice;
                  const compPrice = feed.competitorPrice;
                  const isCheaper = ourPrice !== undefined && compPrice < ourPrice;
                  const isPricier = ourPrice !== undefined && compPrice > ourPrice;

                  return (
                    <TableRow key={feed._id} hover>
                      {/* Product Name */}
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.9375rem' }}>
                          {product.productName || 'Unassigned Product'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {product.category || 'General'}
                        </Typography>
                      </TableCell>

                      {/* Our Price */}
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>
                          ₹{Number(ourPrice || 0).toFixed(2)}
                        </Typography>
                      </TableCell>

                      {/* Competitor Platform Chip */}
                      <TableCell>
                        <Chip
                          label={feed.competitorName}
                          size="small"
                          sx={{
                            backgroundColor:
                              feed.competitorName === 'Amazon'
                                ? '#FEF3C7'
                                : feed.competitorName === 'Flipkart'
                                ? '#EFF6FF'
                                : '#F1F5F9',
                            color:
                              feed.competitorName === 'Amazon'
                                ? '#92400E'
                                : feed.competitorName === 'Flipkart'
                                ? '#1D4ED8'
                                : 'text.primary',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                          }}
                        />
                      </TableCell>

                      {/* Competitor Price */}
                      <TableCell align="right">
                        <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.9375rem' }}>
                          ₹{Number(compPrice).toFixed(2)}
                        </Typography>
                      </TableCell>

                      {/* Comparison Position Badge */}
                      <TableCell align="center">
                        {isCheaper ? (
                          <Chip
                            label={`Cheaper by ₹${(ourPrice - compPrice).toFixed(0)}`}
                            size="small"
                            sx={{ backgroundColor: '#FEE2E2', color: '#B91C1C', fontWeight: 600, fontSize: '0.75rem' }}
                          />
                        ) : isPricier ? (
                          <Chip
                            label={`Pricier by ₹${(compPrice - ourPrice).toFixed(0)}`}
                            size="small"
                            sx={{ backgroundColor: '#DCFCE7', color: '#166534', fontWeight: 600, fontSize: '0.75rem' }}
                          />
                        ) : (
                          <Chip
                            label="Exact Match"
                            size="small"
                            sx={{ backgroundColor: '#F1F5F9', color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem' }}
                          />
                        )}
                      </TableCell>

                      {/* Action */}
                      <TableCell align="center">
                        <Tooltip title="Edit Competitor Price" arrow>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEdit(feed)}
                            sx={{
                              color: 'text.secondary',
                              '&:hover': { color: 'primary.main', backgroundColor: '#EEF2FF' },
                            }}
                          >
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
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

      {/* ── Dialog: Add Competitor Price ─────────────────────────────────────── */}
      <Dialog
        open={isAddOpen}
        onClose={() => !isSubmitting && setIsAddOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleCreateCompetitorPrice}>
          <DialogTitle sx={{ fontWeight: 700 }}>Record Competitor Price</DialogTitle>
          <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Typography variant="body2" color="text.secondary">
              Add market pricing intelligence for an existing product in your catalog.
            </Typography>

            {/* Select Product */}
            <FormControl fullWidth required size="small">
              <InputLabel id="add-product-select-label">Product</InputLabel>
              <Select
                labelId="add-product-select-label"
                value={addForm.productId}
                label="Product"
                onChange={(e) => setAddForm({ ...addForm, productId: e.target.value })}
                disabled={isSubmitting}
              >
                {products.map((prod) => (
                  <MenuItem key={prod._id} value={prod._id}>
                    {prod.productName} (Our Price: ₹{prod.currentPrice})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Competitor Platform Selector Chips */}
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 1 }}>
                Quick Platform Select:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {PRESET_COMPETITORS.map((name) => (
                  <Chip
                    key={name}
                    label={name}
                    clickable
                    color={addForm.competitorName === name ? 'primary' : 'default'}
                    onClick={() => setAddForm({ ...addForm, competitorName: name })}
                    disabled={isSubmitting}
                  />
                ))}
              </Box>
            </Box>

            {/* Competitor Name (Custom Input) */}
            <TextField
              label="Competitor Platform Name"
              fullWidth
              required
              value={addForm.competitorName}
              onChange={(e) => setAddForm({ ...addForm, competitorName: e.target.value })}
              disabled={isSubmitting}
            />

            {/* Competitor Price */}
            <TextField
              label="Competitor Selling Price (₹)"
              type="number"
              inputProps={{ min: 0, step: 'any' }}
              fullWidth
              required
              value={addForm.competitorPrice}
              onChange={(e) => setAddForm({ ...addForm, competitorPrice: e.target.value })}
              disabled={isSubmitting}
              placeholder="e.g. 749"
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
              {isSubmitting ? 'Saving...' : 'Save Competitor Price'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── Dialog: Edit Competitor Price ────────────────────────────────────── */}
      <Dialog
        open={Boolean(editItem)}
        onClose={() => !isSubmitting && setEditItem(null)}
        maxWidth="xs"
        fullWidth
      >
        <form onSubmit={handleUpdateCompetitorPrice}>
          <DialogTitle sx={{ fontWeight: 700 }}>Update Competitor Price</DialogTitle>
          <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Product:{' '}
              <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {editItem?.productId?.productName}
              </Box>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Platform:{' '}
              <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {editItem?.competitorName}
              </Box>
            </Typography>

            <TextField
              label="Competitor Price (₹)"
              type="number"
              inputProps={{ min: 0, step: 'any' }}
              fullWidth
              required
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
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
              {isSubmitting ? 'Saving...' : 'Save Price'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
