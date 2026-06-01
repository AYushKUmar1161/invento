import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  DialogContentText,
  Chip,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import api, { getErrorMessage } from '../services/api';
import { useNotification } from '../context/NotificationContext';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog states
  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products', {
        params: search ? { search } : {}
      });
      setProducts(response.data);
    } catch (err) {
      showNotification(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 400); // Debounce search
    return () => clearTimeout(timer);
  }, [search]);

  // Handle Dialog Actions
  const handleOpenAdd = () => {
    setSelectedProduct(null);
    setFormName('');
    setFormSku('');
    setFormPrice('');
    setFormStock('');
    setFormErrors({});
    setOpenForm(true);
  };

  const handleOpenEdit = (product) => {
    setSelectedProduct(product);
    setFormName(product.name);
    setFormSku(product.sku);
    setFormPrice(product.price.toString());
    setFormStock(product.stock_quantity.toString());
    setFormErrors({});
    setOpenForm(true);
  };

  const handleOpenDelete = (product) => {
    setSelectedProduct(product);
    setOpenDelete(true);
  };

  // Field validation
  const validateForm = () => {
    const errors = {};
    if (!formName.trim()) errors.name = 'Product name is required';
    if (!formSku.trim()) errors.sku = 'SKU is required';
    
    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      errors.price = 'Price must be a number greater than 0';
    }

    const stockNum = parseInt(formStock);
    if (isNaN(stockNum) || stockNum < 0) {
      errors.stock = 'Stock must be a non-negative integer';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProduct = async () => {
    if (!validateForm()) return;

    const payload = {
      name: formName,
      sku: formSku,
      price: parseFloat(formPrice),
      stock_quantity: parseInt(formStock),
    };

    try {
      if (selectedProduct) {
        // Edit action
        await api.put(`/products/${selectedProduct.id}`, payload);
        showNotification('Product updated successfully!', 'success');
      } else {
        // Add action
        await api.post('/products', payload);
        showNotification('Product added successfully!', 'success');
      }
      setOpenForm(false);
      fetchProducts();
    } catch (err) {
      showNotification(getErrorMessage(err), 'error');
    }
  };

  const handleDeleteProduct = async () => {
    try {
      await api.delete(`/products/${selectedProduct.id}`);
      showNotification('Product deleted successfully!', 'success');
      setOpenDelete(false);
      fetchProducts();
    } catch (err) {
      showNotification(getErrorMessage(err), 'error');
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // In-memory filtered list based on search
  const filteredProducts = products;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: '#f0f6fc' }}>
          Product Catalog
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          sx={{ py: 1.2, px: 3 }}
        >
          Add Product
        </Button>
      </Box>

      {/* Filter and Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          placeholder="Search products by Name or SKU..."
          variant="outlined"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            bgcolor: '#161b22',
            borderRadius: '8px',
            '& .MuiOutlinedInput-root': {
              borderColor: '#21262d',
              '& fieldset': { borderColor: '#21262d' },
              '&:hover fieldset': { borderColor: '#30363d' },
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#8b949e' }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Table Section */}
      {loading && products.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : products.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', border: '1px solid #21262d', bgcolor: '#161b22' }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No products found
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Try adjusting your search criteria or add a new product to the system.
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={handleOpenAdd}>
            Add First Product
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ bgcolor: '#161b22', border: '1px solid #21262d', borderRadius: '10px' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product Name</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Stock Quantity</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(filteredProducts) && filteredProducts
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((product) => (
                  <TableRow key={product.id} hover>
                    <TableCell sx={{ fontWeight: 600, color: '#f0f6fc' }}>{product.name}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', color: '#58a6ff' }}>{product.sku}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 500 }}>
                      ₹{product.price != null ? parseFloat(product.price).toFixed(2) : '0.00'}
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={product.stock_quantity != null ? product.stock_quantity.toString() : '0'}
                        color={!product.stock_quantity ? 'error' : product.stock_quantity < 10 ? 'warning' : 'success'}
                        size="small"
                        sx={{ fontWeight: 600, minWidth: 50 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton color="primary" onClick={() => handleOpenEdit(product)} sx={{ mr: 1 }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleOpenDelete(product)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={Array.isArray(filteredProducts) ? filteredProducts.length : 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              borderTop: '1px solid #21262d',
              color: '#8b949e',
              '& .MuiTablePagination-actions': { color: '#8b949e' }
            }}
          />
        </TableContainer>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #21262d', pb: 2 }}>
          {selectedProduct ? 'Edit Product Details' : 'Add New Product'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            label="Product Name"
            fullWidth
            margin="dense"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            error={!!formErrors.name}
            helperText={formErrors.name}
            sx={{ mb: 2 }}
          />
          <TextField
            label="SKU"
            fullWidth
            margin="dense"
            value={formSku}
            onChange={(e) => setFormSku(e.target.value)}
            error={!!formErrors.sku}
            helperText={formErrors.sku}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Price (₹)"
                fullWidth
                margin="dense"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                error={!!formErrors.price}
                helperText={formErrors.price}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Stock Quantity"
                fullWidth
                margin="dense"
                value={formStock}
                onChange={(e) => setFormStock(e.target.value)}
                error={!!formErrors.stock}
                helperText={formErrors.stock}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, borderTop: '1px solid #21262d' }}>
          <Button onClick={() => setOpenForm(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSaveProduct} variant="contained">
            Save Product
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete <strong>{selectedProduct?.name}</strong> (SKU: {selectedProduct?.sku})? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenDelete(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteProduct} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
