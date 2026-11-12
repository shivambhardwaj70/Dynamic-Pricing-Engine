/**
 * src/pages/Pricing.jsx
 *
 * ⭐ PRIMARY DEMO PAGE — Pricing Recommendation Engine
 *
 * Capabilities:
 *  1. Product Selector: Pick any product from the catalog (GET /api/products)
 *  2. Market Demand Toggle: Segmented controls for HIGH, NORMAL, LOW demand
 *  3. Simulation Overrides (What-If Analysis): Option to test custom stock quantities
 *     or competitor prices on the fly without altering the database
 *  4. Execute Dynamic Pricing: Calls POST /api/pricing/calculate-price
 *  5. Visual Split-Screen Output:
 *     - Hero Price Comparison Card: Original vs. Recommended (with net % change badge)
 *     - Rule Engine Breakdown: Visual audit of all 4 business rules (Active vs Inactive)
 *     - AI Explanation Card: Prominently styled natural-language rationale
 *  6. Recent Pricing History: Chronological audit trail for the selected product
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Chip,
  Divider,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
} from '@mui/material';

// Icons
import AutoGraphRoundedIcon from '@mui/icons-material/AutoGraphRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import WhatshotRoundedIcon from '@mui/icons-material/WhatshotRounded';
import TrendingFlatRoundedIcon from '@mui/icons-material/TrendingFlatRounded';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';

// Common Components & API Client
import PageHeader from '../components/common/PageHeader';
import { useToast } from '../components/common/ToastProvider';
import { productsApi, pricingApi } from '../api/client';

export default function Pricing() {
  const { showToast } = useToast();

  // ─── 1. Core State Variables ────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [demand, setDemand] = useState('NORMAL'); // 'HIGH' | 'NORMAL' | 'LOW'
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Simulation Overrides (for What-If demonstration testing)
  const [manualStock, setManualStock] = useState('');
  const [manualCompetitorPrice, setManualCompetitorPrice] = useState('');

  // Calculation Results
  const [isCalculating, setIsCalculating] = useState(false);
  const [pricingResult, setPricingResult] = useState(null);

  // Product Pricing History Audit Trail
  const [historyRecords, setHistoryRecords] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ─── 2. Data Fetching Functions ─────────────────────────────────────────────

  /**
   * Purpose:
   *   Fetches the full product catalog from MongoDB to populate the product dropdown.
   *
   * When it executes:
   *   - Automatically on component mount (initial page load).
   *
   * Inputs:
   *   None
   *
   * What it updates or calls:
   *   - Calls: productsApi.getAll() -> GET /api/products
   *   - Updates: `products` state array
   *   - Auto-selects the first product if none is currently selected.
   */
  const fetchProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const res = await productsApi.getAll();
      const list = res.data.data || [];
      setProducts(list);
      if (list.length > 0 && !selectedProductId) {
        setSelectedProductId(list[0]._id);
      }
    } catch (err) {
      console.error('Failed to load products list:', err);
      showToast('Failed to load products for pricing engine.', 'error');
    } finally {
      setLoadingProducts(false);
    }
  }, [selectedProductId, showToast]);

  /**
   * Purpose:
   *   Fetches recent price recommendation logs for the currently selected product.
   *
   * When it executes:
   *   - Whenever `selectedProductId` changes
   *   - Immediately after a new price calculation is generated (to show the new audit log)
   *
   * Inputs:
   *   {string} productId - The MongoDB _id of the product.
   *
   * What it updates or calls:
   *   - Calls: pricingApi.getHistory(productId) -> GET /api/pricing/history/:productId
   *   - Updates: `historyRecords` state array.
   */
  const fetchHistory = useCallback(async (productId) => {
    if (!productId) return;
    try {
      setLoadingHistory(true);
      const res = await pricingApi.getHistory(productId);
      setHistoryRecords(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch pricing history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Mount effect to fetch products
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Fetch history whenever selected product changes
  useEffect(() => {
    if (selectedProductId) {
      fetchHistory(selectedProductId);
    }
  }, [selectedProductId, fetchHistory]);

  // Currently selected product object
  const currentProduct = useMemo(() => {
    return products.find((p) => p._id === selectedProductId) || null;
  }, [products, selectedProductId]);

  // ─── 3. Action Handler: Generate Price Recommendation ───────────────────────

  /**
   * Purpose:
   *   Calls the backend Pricing Engine service to calculate dynamic pricing,
   *   evaluates the 4 business rules, generates an AI explanation, and logs
   *   the recommendation to the database audit trail.
   *
   * When it executes:
   *   - User clicks the "Generate Price Recommendation" button.
   *
   * Inputs:
   *   {Event} e - Optional click event.
   *
   * What it updates or calls:
   *   - Calls: pricingApi.calculate({
   *       productId,
   *       demand,
   *       manualStockQuantity,
   *       manualCompetitorPrice
   *     }) -> POST /api/pricing/calculate-price
   *   - Updates: `pricingResult` with calculation data, applied rules, and AI rationale.
   *   - Updates: Refreshes history audit trail with `fetchHistory(selectedProductId)`.
   *   - Shows success toast.
   */
  const handleCalculatePrice = async () => {
    if (!selectedProductId) {
      showToast('Please select a product from the catalog.', 'warning');
      return;
    }

    try {
      setIsCalculating(true);

      // Build payload with optional simulation overrides
      const payload = {
        productId: selectedProductId,
        demand,
      };

      if (manualStock.trim() !== '') {
        payload.manualStockQuantity = Number(manualStock);
      }
      if (manualCompetitorPrice.trim() !== '') {
        payload.manualCompetitorPrice = Number(manualCompetitorPrice);
      }

      const res = await pricingApi.calculate(payload);
      setPricingResult(res.data.data);
      showToast('Dynamic price calculated and explained by AI!', 'success');

      // Refresh pricing audit history table below
      fetchHistory(selectedProductId);
    } catch (err) {
      showToast(err.message || 'Failed to calculate dynamic price.', 'error');
    } finally {
      setIsCalculating(false);
    }
  };

  // ─── 4. Helper: Definition of the 4 Core Rules for Visual Audit ─────────────
  const ALL_RULES = [
    {
      id: 'RULE_1',
      name: 'Rule 1: Scarcity Surge',
      badge: '+10%',
      color: '#EF4444',
      condition: 'Demand is HIGH and Inventory is LOW (≤ 10 units)',
    },
    {
      id: 'RULE_2',
      name: 'Rule 2: Inventory Clearance',
      badge: '-10%',
      color: '#F59E0B',
      condition: 'Demand is LOW and Inventory is HIGH (≥ 100 units)',
    },
    {
      id: 'RULE_3',
      name: 'Rule 3: Competitor Under-Cut Defense',
      badge: '-5%',
      color: '#3B82F6',
      condition: 'Lowest competitor price is cheaper than our base price',
    },
    {
      id: 'RULE_4',
      name: 'Rule 4: Competitor Premium Advantage',
      badge: '+3%',
      color: '#10B981',
      condition: 'Lowest competitor price is higher than our base price',
    },
  ];

  return (
    <Box>
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <PageHeader
        title="Pricing Recommendation Engine"
        subtitle="⭐ Primary Project Demo — Evaluate rule-based market adjustments and generate natural-language AI explanations."
      />

      {/* ── Control Panel (Input Form) ───────────────────────────────────────── */}
      <Card sx={{ mb: 4, border: '1px solid #E2E8F0', borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                backgroundColor: '#EEF2FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TuneRoundedIcon sx={{ color: 'primary.main', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Pricing Control & Simulation Parameters
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Select a product, configure market demand, and trigger the dynamic rule engine.
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={3}>
            {/* Product Selector */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="product-pricing-select-label">Select Product</InputLabel>
                <Select
                  labelId="product-pricing-select-label"
                  value={selectedProductId}
                  label="Select Product"
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    setPricingResult(null); // Reset previous calculation when changing product
                  }}
                  disabled={loadingProducts || isCalculating}
                >
                  {products.map((prod) => (
                    <MenuItem key={prod._id} value={prod._id}>
                      {prod.productName} ({prod.category} — Base: ₹{Number(prod.currentPrice).toFixed(2)})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {currentProduct && (
                <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.75, display: 'block' }}>
                  Current Catalog Price: <strong>₹{Number(currentProduct.currentPrice).toFixed(2)}</strong> | Category: {currentProduct.category}
                </Typography>
              )}
            </Grid>

            {/* Demand Selector */}
            <Grid item xs={12} md={6}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>
                MARKET DEMAND FACTOR
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {/* HIGH DEMAND BUTTON */}
                <Button
                  fullWidth
                  variant={demand === 'HIGH' ? 'contained' : 'outlined'}
                  color="error"
                  startIcon={<WhatshotRoundedIcon />}
                  onClick={() => setDemand('HIGH')}
                  disabled={isCalculating}
                  sx={{
                    py: 1,
                    fontWeight: 700,
                    backgroundColor: demand === 'HIGH' ? '#EF4444' : 'transparent',
                  }}
                >
                  HIGH DEMAND
                </Button>

                {/* NORMAL DEMAND BUTTON */}
                <Button
                  fullWidth
                  variant={demand === 'NORMAL' ? 'contained' : 'outlined'}
                  color="primary"
                  startIcon={<TrendingFlatRoundedIcon />}
                  onClick={() => setDemand('NORMAL')}
                  disabled={isCalculating}
                  sx={{ py: 1, fontWeight: 700 }}
                >
                  NORMAL
                </Button>

                {/* LOW DEMAND BUTTON */}
                <Button
                  fullWidth
                  variant={demand === 'LOW' ? 'contained' : 'outlined'}
                  color="warning"
                  startIcon={<ArrowDownwardRoundedIcon />}
                  onClick={() => setDemand('LOW')}
                  disabled={isCalculating}
                  sx={{
                    py: 1,
                    fontWeight: 700,
                    backgroundColor: demand === 'LOW' ? '#F59E0B' : 'transparent',
                    color: demand === 'LOW' ? '#fff' : undefined,
                  }}
                >
                  LOW DEMAND
                </Button>
              </Box>
            </Grid>

            {/* Optional Simulation Overrides Accordion */}
            <Grid item xs={12}>
              <Accordion
                disableGutters
                elevation={0}
                sx={{
                  border: '1px dashed #CBD5E1',
                  borderRadius: 2,
                  backgroundColor: '#F8FAFC',
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                      🧪 What-If Simulation Overrides (Optional)
                    </Typography>
                    <Chip label="For Demo Testing" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }} />
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                    Leave blank to use live database records for inventory and competitor pricing. Enter values below to simulate scenarios (e.g., test ≤10 units for scarcity surge or cheaper competitor prices).
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Simulate Inventory Stock (units)"
                        placeholder="e.g. 5 (triggers Low Stock <= 10)"
                        type="number"
                        inputProps={{ min: 0 }}
                        fullWidth
                        size="small"
                        value={manualStock}
                        onChange={(e) => setManualStock(e.target.value)}
                        disabled={isCalculating}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Simulate Lowest Competitor Price (₹)"
                        placeholder="e.g. 699 (triggers Rule 3 if cheaper)"
                        type="number"
                        inputProps={{ min: 0, step: 'any' }}
                        fullWidth
                        size="small"
                        value={manualCompetitorPrice}
                        onChange={(e) => setManualCompetitorPrice(e.target.value)}
                        disabled={isCalculating}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Execute Button */}
            <Grid item xs={12}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleCalculatePrice}
                disabled={isCalculating || !selectedProductId}
                startIcon={isCalculating ? <CircularProgress size={20} color="inherit" /> : <BoltRoundedIcon />}
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
                }}
              >
                {isCalculating ? 'Executing Pricing Engine & Generating AI Explanation...' : 'Generate Price Recommendation'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ── Calculation Results Display ──────────────────────────────────────── */}
      {pricingResult && (
        <Box sx={{ mb: 4 }}>
          {/* 1. Hero Price Comparison Card */}
          <Card
            sx={{
              mb: 3,
              borderRadius: 3,
              border: '1px solid #C7D2FE',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F7FF 100%)',
              boxShadow: '0 8px 30px rgba(79,70,229,0.12)',
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
              <Grid container spacing={3} alignItems="center">
                {/* Original Base Price */}
                <Grid item xs={12} sm={4} sx={{ textAlign: { xs: 'left', sm: 'center' } }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: '0.05em' }}>
                    ORIGINAL BASE PRICE
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.secondary', mt: 0.5, textDecoration: 'line-through' }}>
                    ₹{Number(pricingResult.originalPrice).toFixed(2)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    Catalog Price
                  </Typography>
                </Grid>

                {/* Arrow / Adjustment Pill */}
                <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
                  <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        backgroundColor: '#EEF2FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ArrowForwardRoundedIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                    </Box>
                    <Chip
                      label={`Adjustment: ${pricingResult.totalPercentageAdjustment}`}
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.8125rem',
                        backgroundColor:
                          pricingResult.netChange > 0
                            ? '#DCFCE7'
                            : pricingResult.netChange < 0
                            ? '#FEE2E2'
                            : '#F1F5F9',
                        color:
                          pricingResult.netChange > 0
                            ? '#166534'
                            : pricingResult.netChange < 0
                            ? '#B91C1C'
                            : 'text.secondary',
                      }}
                    />
                  </Box>
                </Grid>

                {/* Recommended Dynamic Price */}
                <Grid item xs={12} sm={4} sx={{ textAlign: { xs: 'left', sm: 'center' } }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: '0.05em' }}>
                    RECOMMENDED DYNAMIC PRICE
                  </Typography>
                  <Typography variant="h2" sx={{ fontWeight: 900, color: 'primary.main', mt: 0.5 }}>
                    ₹{Number(pricingResult.recommendedPrice).toFixed(2)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Net Change: {pricingResult.netChange >= 0 ? `+₹${pricingResult.netChange.toFixed(2)}` : `-₹${Math.abs(pricingResult.netChange).toFixed(2)}`}
                  </Typography>
                </Grid>
              </Grid>

              {/* Factors Evaluated Strip */}
              <Box
                sx={{
                  mt: 3,
                  pt: 2.5,
                  borderTop: '1px solid #E2E8F0',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 3,
                  justifyContent: 'center',
                }}
              >
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Demand Factor: <strong>{pricingResult.factorsEvaluated.demand}</strong>
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Available Stock: <strong>{pricingResult.factorsEvaluated.availableQuantity} units</strong> ({pricingResult.factorsEvaluated.stockStatus})
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Competitor Baseline:{' '}
                  <strong>
                    {typeof pricingResult.factorsEvaluated.competitorPrice === 'number'
                      ? `₹${pricingResult.factorsEvaluated.competitorPrice}`
                      : pricingResult.factorsEvaluated.competitorPrice}
                  </strong>
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* 2. Side-by-Side: Rule Engine Breakdown & AI Explanation Box */}
          <Grid container spacing={3}>
            {/* Rule Engine Breakdown Card */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', borderRadius: 3, border: '1px solid #E2E8F0' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1.5,
                        backgroundColor: '#EEF2FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <AutoGraphRoundedIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      Rule Engine Audit ({pricingResult.appliedRulesCount} Triggered)
                    </Typography>
                  </Box>

                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
                    Evaluation of all 4 business rules defined in the system:
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {ALL_RULES.map((rule) => {
                      const applied = pricingResult.appliedRules.find((r) => r.rule === rule.id);
                      return (
                        <Paper
                          key={rule.id}
                          variant="outlined"
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            backgroundColor: applied ? '#F8FAFC' : '#FFFFFF',
                            borderColor: applied ? 'primary.main' : '#E2E8F0',
                            borderWidth: applied ? '1.5px' : '1px',
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {applied ? (
                                <CheckCircleRoundedIcon sx={{ color: 'success.main', fontSize: 18 }} />
                              ) : (
                                <CancelOutlinedIcon sx={{ color: '#CBD5E1', fontSize: 18 }} />
                              )}
                              <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: applied ? 'text.primary' : 'text.disabled' }}>
                                {rule.name}
                              </Typography>
                            </Box>
                            <Chip
                              label={applied ? `TRIGGERED (${rule.badge})` : 'INACTIVE'}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.6875rem',
                                backgroundColor: applied ? '#DCFCE7' : '#F1F5F9',
                                color: applied ? '#166534' : '#94A3B8',
                              }}
                            />
                          </Box>
                          <Typography variant="caption" sx={{ color: applied ? 'text.secondary' : 'text.disabled', display: 'block' }}>
                            {applied ? applied.description : rule.condition}
                          </Typography>
                        </Paper>
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* AI Explanation Box */}
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  border: '1.5px solid #818CF8',
                  background: 'linear-gradient(135deg, #FAF5FF 0%, #EEF2FF 100%)',
                  boxShadow: '0 8px 24px rgba(99,102,241,0.1)',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(139,92,246,0.3)',
                        }}
                      >
                        <AutoAwesomeRoundedIcon sx={{ color: '#fff', fontSize: 18 }} />
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E1B4B' }}>
                          AI Pricing Rationale
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6366F1', fontWeight: 600 }}>
                          Plain-English Explanation for Executives
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label="Gemini AI"
                      size="small"
                      sx={{
                        backgroundColor: '#8B5CF6',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.6875rem',
                      }}
                    />
                  </Box>

                  <Divider sx={{ mb: 2.5, borderColor: 'rgba(99,102,241,0.2)' }} />

                  {/* Plain-English Explanation Text */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E0E7FF',
                      minHeight: 180,
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        color: '#1E293B',
                        lineHeight: 1.7,
                        fontSize: '0.9375rem',
                        fontWeight: 500,
                      }}
                    >
                      {pricingResult.aiExplanation}
                    </Typography>
                  </Paper>

                  {/* Architecture Clarification Callout */}
                  <Box
                    sx={{
                      mt: 2.5,
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      border: '1px dashed #C7D2FE',
                    }}
                  >
                    <Typography variant="caption" sx={{ color: '#4338CA', fontWeight: 600, display: 'block' }}>
                      💡 System Architecture Note:
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      Pricing adjustments are computed deterministically by the mathematical Rule Engine. The AI provides human interpretability and governance transparency.
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* ── Product Pricing History Audit Trail ──────────────────────────────── */}
      <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <HistoryRoundedIcon sx={{ color: 'text.secondary' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Pricing Recommendation Audit Log
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Chronological audit trail of dynamic price calculations saved in MongoDB:
          </Typography>

          {loadingHistory ? (
            <Box sx={{ py: 3, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          ) : historyRecords.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, backgroundColor: '#F8FAFC', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                No past price recommendation history for this product yet.
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                Click "Generate Price Recommendation" above to compute and persist your first record.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {historyRecords.slice(0, 5).map((record) => (
                <Paper
                  key={record._id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 1.5,
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: 'text.primary' }}>
                        ₹{Number(record.oldPrice).toFixed(2)} → ₹{Number(record.recommendedPrice).toFixed(2)}
                      </Typography>
                      <Chip
                        label={record.reason}
                        size="small"
                        sx={{ fontSize: '0.7rem', fontWeight: 600, backgroundColor: '#EEF2FF', color: 'primary.main' }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block', maxWidth: 650 }}>
                      {record.aiExplanation}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.disabled', whiteSpace: 'nowrap' }}>
                    {new Date(record.createdAt).toLocaleString()}
                  </Typography>
                </Paper>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
