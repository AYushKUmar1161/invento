import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Divider,
  Card,
  CardContent,
  Alert,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  RemoveCircleOutline as RemoveIcon,
  AddCircleOutline as PlusIcon,
} from '@mui/icons-material';
import api, { getErrorMessage } from '../services/api';
import { useNotification } from '../context/NotificationContext';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  // Create Order Dialog states
  const [openWizard, setOpenWizard] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedItems, setSelectedItems] = useState([{ product_id: '', quantity: 1 }]);
  const [wizardError, setWizardError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, customersRes, productsRes] = await Promise.all([
        api.get('/orders'),
        api.get('/customers'),
        api.get('/products'),
      ]);
      setOrders(ordersRes.data);
      setCustomers(customersRes.data);
      setProducts(productsRes.data);
    } catch (err) {
      showNotification('Failed to load transaction data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenWizard = () => {
    if (customers.length === 0) {
      showNotification('Please register at least one customer first!', 'warning');
      return;
    }
    if (products.length === 0) {
      showNotification('Please add at least one product first!', 'warning');
      return;
    }
    setSelectedCustomerId('');
    setSelectedItems([{ product_id: '', quantity: 1 }]);
    setWizardError('');
    setOpenWizard(true);
  };

  const handleAddItemRow = () => {
    setSelectedItems([...selectedItems, { product_id: '', quantity: 1 }]);
  };

  const handleRemoveItemRow = (index) => {
    const values = [...selectedItems];
    values.splice(index, 1);
    setSelectedItems(values);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...selectedItems];
    updated[index][field] = value;
    setSelectedItems(updated);
  };

  // Calculate live order total in frontend
  const calculateTotal = () => {
    let total = 0;
    selectedItems.forEach((item) => {
      const prod = products.find((p) => p.id === item.product_id);
      if (prod) {
        total += parseFloat(prod.price) * parseInt(item.quantity || 0, 10);
      }
    });
    return total;
  };

  const handleCreateOrder = async () => {
    setWizardError('');

    // Validations
    if (!selectedCustomerId) {
      setWizardError('Please select a customer for the order.');
      return;
    }

    if (selectedItems.some((item) => !item.product_id)) {
      setWizardError('All item rows must have a product selected.');
      return;
    }

    // Verify stock levels on client-side before sending
    for (let i = 0; i < selectedItems.length; i++) {
      const item = selectedItems[i];
      const prod = products.find((p) => p.id === item.product_id);
      if (prod && prod.stock_quantity < item.quantity) {
        setWizardError(`Insufficient stock for product '${prod.name}'. Current stock: ${prod.stock_quantity}, requested: ${item.quantity}`);
        return;
      }
    }

    const payload = {
      customer_id: selectedCustomerId,
      items: selectedItems.map((item) => ({
        product_id: parseInt(item.product_id),
        quantity: parseInt(item.quantity),
      })),
    };

    try {
      const response = await api.post('/orders', payload);
      showNotification('Order placed successfully!', 'success');
      setOpenWizard(false);
      // Fetch fresh products and orders since stocks changed
      fetchData();
      // Redirect to Order Details page
      navigate(`/orders/${response.data.id}`);
    } catch (err) {
      setWizardError(getErrorMessage(err));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'Cancelled': return 'error';
      default: return 'warning'; // Pending
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: '#f0f6fc' }}>
          Purchase Orders
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenWizard}
          sx={{ py: 1.2, px: 3 }}
        >
          Create Order
        </Button>
      </Box>

      {/* Table Section */}
      {loading && orders.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : orders.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', border: '1px solid #21262d', bgcolor: '#161b22' }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No purchase orders placed yet
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Start recording orders to track customer actions and automated stock reduction.
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={handleOpenWizard}>
            Create First Order
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ bgcolor: '#161b22', border: '1px solid #21262d', borderRadius: '10px' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell align="right">Total Amount</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell>Placement Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell sx={{ fontWeight: 600, color: '#8b949e' }}>#{order.id}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#f0f6fc' }}>{order.customer_name}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#58a6ff' }}>
                    ₹{order.total_amount != null ? parseFloat(order.total_amount).toFixed(2) : '0.00'}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={order.status}
                      color={getStatusColor(order.status)}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#8b949e' }}>
                    {new Date(order.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      View Receipt
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Order Dialog (Wizard) */}
      <Dialog open={openWizard} onClose={() => setOpenWizard(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #21262d', pb: 2 }}>
          Place New Purchase Order
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          {wizardError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {wizardError}
            </Alert>
          )}

          {/* Select Customer */}
          <FormControl fullWidth sx={{ mb: 4, mt: 1 }}>
            <InputLabel>Select Customer</InputLabel>
            <Select
              value={selectedCustomerId}
              label="Select Customer"
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            >
              {customers.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.full_name} ({c.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#f0f6fc' }}>
            Products & Quantities
          </Typography>
          <Divider sx={{ mb: 2, borderColor: '#21262d' }} />

          {/* Item Rows */}
          {selectedItems.map((item, index) => {
            const currentProduct = products.find((p) => p.id === item.product_id);
            return (
              <Grid container spacing={2} alignItems="center" key={index} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Select Product</InputLabel>
                    <Select
                      value={item.product_id}
                      label="Select Product"
                      onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                    >
                      {products.map((p) => (
                        <MenuItem key={p.id} value={p.id} disabled={p.stock_quantity === 0}>
                          {p.name} - ₹{p.price != null ? parseFloat(p.price).toFixed(2) : '0.00'} ({p.stock_quantity} in stock)
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <IconButton
                      size="small"
                      color="inherit"
                      disabled={item.quantity <= 1}
                      onClick={() => handleItemChange(index, 'quantity', item.quantity - 1)}
                    >
                      <RemoveIcon />
                    </IconButton>
                    <Typography sx={{ fontWeight: 600, minWidth: 20, textAlign: 'center' }}>
                      {item.quantity}
                    </Typography>
                    <IconButton
                      size="small"
                      color="inherit"
                      disabled={currentProduct && item.quantity >= currentProduct.stock_quantity}
                      onClick={() => handleItemChange(index, 'quantity', item.quantity + 1)}
                    >
                      <PlusIcon />
                    </IconButton>
                  </Box>
                </Grid>

                <Grid item xs={2} align="right">
                  <Typography sx={{ fontWeight: 600, color: '#58a6ff' }}>
                    {currentProduct && currentProduct.price != null
                      ? `₹${(parseFloat(currentProduct.price) * item.quantity).toFixed(2)}`
                      : '₹0.00'}
                  </Typography>
                </Grid>

                <Grid item xs={1}>
                  <IconButton
                    color="error"
                    disabled={selectedItems.length === 1}
                    onClick={() => handleRemoveItemRow(index)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Grid>
              </Grid>
            );
          })}

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddItemRow}
            sx={{ mt: 2, mb: 4 }}
          >
            Add Another Product
          </Button>

          <Card sx={{ bgcolor: '#0d1117', border: '1px dashed #21262d', borderRadius: '8px' }}>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: '16px !important' }}>
              <Typography sx={{ fontWeight: 700, color: '#8b949e' }}>Grand Total:</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#3fb950', fontFamily: "'Outfit', sans-serif" }}>
                ₹{calculateTotal().toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, borderTop: '1px solid #21262d' }}>
          <Button onClick={() => setOpenWizard(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleCreateOrder} variant="contained" color="success">
            Place Order
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
