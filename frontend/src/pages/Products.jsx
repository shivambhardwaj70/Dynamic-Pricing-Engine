/**
 * src/pages/Products.jsx
 *
 * Product Catalog & Management Page
 *
 * Capabilities:
 *  1. Fetches all products on mount via GET /api/products
 *  2. Search filtering by product name and category in memory
 *  3. "Add Product" Dialog -> POST /api/products
 *  4. "Edit Product" Dialog -> PUT /api/products/:id
 *  5. "Delete Product" Confirmation Dialog -> DELETE /api/products/:id
 *  6. Integrated with useToast() for instant success/error feedback
 */
import React, { useState, useEffect, useMemo } from 'react';
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
} from '@mui/material';

// Icons
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';

// Common Components & API
import PageHeader from '../components/common/PageHeader';
import { LoadingState, EmptyState, ErrorState } from '../components/common/LoadingState';
import { useToast } from '../components/common/ToastProvider';
import { productsApi } from '../api/client';

export default function Products() {
  const { showToast } = useToast();

  // ─── 1. Core State ──────────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ─── 2. Dialog / Modal States ───────────────────────────────────────────────
  // Add Product Dialog
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ productName: '', category: '', currentPrice: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Product Dialog
  const [editProduct, setEditProduct] = useState(null); // null when closed, product object when open
  const [editForm, setEditForm] = useState({ productName: '', category: '', currentPrice: '' });

  // Delete Confirmation Dialog
  const [deleteProductTarget, setDeleteProductTarget] = useState(null);

  // ─── 3. Fetch Products from Backend API ────────────────────────────────────
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productsApi.getAll();
      // Backend returns: { success: true, count: N, data: [ ... ] }
      setProducts(response.data.data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError(err.message || 'Unable to connect to the backend server.');
    } finally {
      setLoading(false);
    }
  };

  // Run once when component mounts
  useEffect(() => {
    fetchProducts();
  }, []);

  // ─── 4. Client-side Search Filtering ───────────────────────────────────────
  // useMemo re-calculates filtered products only when products or searchQuery changes
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.productName.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  // ─── 5. Handler: Create Product ────────────────────────────────────────────
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!addForm.productName || !addForm.category || !addForm.currentPrice) {
      showToast('Please fill in all product fields.', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      await productsApi.create({
        productName: addForm.productName.trim(),
        category: addForm.category.trim(),
        currentPrice: Number(addForm.currentPrice),
      });

      showToast('Product created successfully!', 'success');
      setIsAddOpen(false);
      setAddForm({ productName: '', category: '', currentPrice: '' });
      fetchProducts(); // Refresh list to get new product
    } catch (err) {
      showToast(err.message || 'Failed to create product.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── 6. Handler: Open & Save Edit ──────────────────────────────────────────
  const handleOpenEdit = (product) => {
    setEditProduct(product);
    setEditForm({
      productName: product.productName,
      category: product.category,
      currentPrice: product.currentPrice,
    });
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editProduct) return;

    try {
      setIsSubmitting(true);
      await productsApi.update(editProduct._id, {
        productName: editForm.productName.trim(),
        category: editForm.category.trim(),
        currentPrice: Number(editForm.currentPrice),
      });

      showToast('Product updated successfully!', 'success');
      setEditProduct(null);
      fetchProducts(); // Refresh list to show updated details
    } catch (err) {
      showToast(err.message || 'Failed to update product.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── 7. Handler: Delete Product ────────────────────────────────────────────
  const handleDeleteProduct = async () => {
    if (!deleteProductTarget) return;

    try {
      setIsSubmitting(true);
      await productsApi.delete(deleteProductTarget._id);
      showToast(`"${deleteProductTarget.productName}" deleted successfully!`, 'success');
      setDeleteProductTarget(null);
      fetchProducts(); // Refresh list
    } catch (err) {
      showToast(err.message || 'Failed to delete product.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <PageHeader
        title="Product Catalog"
        subtitle="Manage your base products, monitor catalog pricing, and organize inventory categories."
        action={
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => setIsAddOpen(true)}
            sx={{ px: 2.5 }}
          >
            Add Product
          </Button>
        }
      />

      {/* ── Search Bar & Quick Metrics ───────────────────────────────────────── */}
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
          placeholder="Search by product name or category..."
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
            {filteredProducts.length}
          </Box>{' '}
          of {products.length} products
        </Typography>
      </Box>

      {/* ── Products Table Card ──────────────────────────────────────────────── */}
      <Card>
        {loading ? (
          <LoadingState rows={5} cols={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchProducts} />
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon={<StorefrontRoundedIcon />}
            title={searchQuery ? 'No Matching Products' : 'No Products in Catalog'}
            message={
              searchQuery
                ? `No product found matching "${searchQuery}". Try a different search term.`
                : 'Your catalog is empty. Click "Add Product" above to create your first item.'
            }
            action={
              !searchQuery && (
                <Button
                  variant="outlined"
                  startIcon={<AddRoundedIcon />}
                  onClick={() => setIsAddOpen(true)}
                >
                  Create First Product
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
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Base / Current Price</TableCell>
                  <TableCell>Product ID</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product._id} hover>
                    {/* Product Name */}
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.9375rem' }}>
                        {product.productName}
                      </Typography>
                    </TableCell>

                    {/* Category */}
                    <TableCell>
                      <Chip
                        label={product.category}
                        size="small"
                        sx={{
                          backgroundColor: '#EEF2FF',
                          color: '#4F46E5',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                        }}
                      />
                    </TableCell>

                    {/* Current Price */}
                    <TableCell align="right">
                      <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.9375rem' }}>
                        ₹{Number(product.currentPrice).toFixed(2)}
                      </Typography>
                    </TableCell>

                    {/* Mongo _id (truncated for clean UI) */}
                    <TableCell>
                      <Tooltip title={product._id} arrow>
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: 'monospace',
                            color: 'text.secondary',
                            backgroundColor: '#F1F5F9',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                          }}
                        >
                          {product._id.slice(-6)}
                        </Typography>
                      </Tooltip>
                    </TableCell>

                    {/* Action Buttons */}
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <Tooltip title="Edit Product" arrow>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEdit(product)}
                            sx={{
                              color: 'text.secondary',
                              '&:hover': { color: 'primary.main', backgroundColor: '#EEF2FF' },
                            }}
                          >
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete Product" arrow>
                          <IconButton
                            size="small"
                            onClick={() => setDeleteProductTarget(product)}
                            sx={{
                              color: 'text.secondary',
                              '&:hover': { color: 'error.main', backgroundColor: '#FEE2E2' },
                            }}
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* ── Dialog: Add Product ──────────────────────────────────────────────── */}
      <Dialog
        open={isAddOpen}
        onClose={() => !isSubmitting && setIsAddOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleCreateProduct}>
          <DialogTitle sx={{ fontWeight: 700 }}>Add New Product</DialogTitle>
          <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Typography variant="body2" color="text.secondary">
              Enter the product specifications below to add it to the dynamic catalog.
            </Typography>

            <TextField
              label="Product Name"
              placeholder="e.g. Wireless Ergonomic Mouse"
              fullWidth
              required
              value={addForm.productName}
              onChange={(e) => setAddForm({ ...addForm, productName: e.target.value })}
              disabled={isSubmitting}
            />

            <TextField
              label="Category"
              placeholder="e.g. Electronics, Footwear, Home"
              fullWidth
              required
              value={addForm.category}
              onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
              disabled={isSubmitting}
            />

            <TextField
              label="Current / Base Price (₹)"
              placeholder="e.g. 799"
              type="number"
              inputProps={{ min: 0, step: 'any' }}
              fullWidth
              required
              value={addForm.currentPrice}
              onChange={(e) => setAddForm({ ...addForm, currentPrice: e.target.value })}
              disabled={isSubmitting}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button
              onClick={() => setIsAddOpen(false)}
              disabled={isSubmitting}
              color="inherit"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {isSubmitting ? 'Creating...' : 'Create Product'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── Dialog: Edit Product ─────────────────────────────────────────────── */}
      <Dialog
        open={Boolean(editProduct)}
        onClose={() => !isSubmitting && setEditProduct(null)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleUpdateProduct}>
          <DialogTitle sx={{ fontWeight: 700 }}>Edit Product Details</DialogTitle>
          <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Typography variant="body2" color="text.secondary">
              Update the product details or adjust the base selling price.
            </Typography>

            <TextField
              label="Product Name"
              fullWidth
              required
              value={editForm.productName}
              onChange={(e) => setEditForm({ ...editForm, productName: e.target.value })}
              disabled={isSubmitting}
            />

            <TextField
              label="Category"
              fullWidth
              required
              value={editForm.category}
              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              disabled={isSubmitting}
            />

            <TextField
              label="Current / Base Price (₹)"
              type="number"
              inputProps={{ min: 0, step: 'any' }}
              fullWidth
              required
              value={editForm.currentPrice}
              onChange={(e) => setEditForm({ ...editForm, currentPrice: e.target.value })}
              disabled={isSubmitting}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button
              onClick={() => setEditProduct(null)}
              disabled={isSubmitting}
              color="inherit"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── Dialog: Delete Confirmation ──────────────────────────────────────── */}
      <Dialog
        open={Boolean(deleteProductTarget)}
        onClose={() => !isSubmitting && setDeleteProductTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          Delete Product?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete{' '}
            <Box component="span" sx={{ fontWeight: 700 }}>
              "{deleteProductTarget?.productName}"
            </Box>
            ? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setDeleteProductTarget(null)}
            disabled={isSubmitting}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteProduct}
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {isSubmitting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
