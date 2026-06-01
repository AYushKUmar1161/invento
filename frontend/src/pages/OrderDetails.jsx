import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
  Grid,
  Divider,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  LocalPrintshop as PrintIcon,
} from '@mui/icons-material';
import api, { getErrorMessage } from '../services/api';
import { useNotification } from '../context/NotificationContext';

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/${id}`);
      setOrder(response.data);
    } catch (err) {
      showNotification(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'Cancelled': return 'error';
      default: return 'warning';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!order) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" color="textSecondary" gutterBottom>
          Order Not Found
        </Typography>
        <Button variant="contained" onClick={() => navigate('/orders')} sx={{ mt: 2 }}>
          Back to Orders
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      {/* Navigation & Print Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, '@media print': { display: 'none' } }}>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => navigate('/orders')}
        >
          Back to Orders
        </Button>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          sx={{ bgcolor: '#30363d', color: '#f0f6fc', '&:hover': { bgcolor: '#21262d' } }}
        >
          Print Receipt
        </Button>
      </Box>

      {/* Invoice Digital Card */}
      <Card
        sx={{
          border: '1px solid #21262d',
          borderRadius: '12px',
          bgcolor: '#161b22',
          p: { xs: 2, sm: 4 },
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          '@media print': {
            border: 'none',
            boxShadow: 'none',
            bgcolor: '#fff',
            color: '#000',
            p: 0
          }
        }}
      >
        <CardContent>
          {/* Header invoice details */}
          <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
            <Grid item>
              <Typography variant="h5" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: '#f0f6fc', '@media print': { color: '#000' } }}>
                Purchase Invoice
              </Typography>
              <Typography variant="subtitle2" sx={{ color: '#8b949e', mt: 0.5, '@media print': { color: '#555' } }}>
                Order Ref: #{order.id}
              </Typography>
            </Grid>
            <Grid item sx={{ textAlign: 'right' }}>
              <Chip
                label={order.status}
                color={getStatusColor(order.status)}
                sx={{ fontWeight: 700 }}
              />
              <Typography variant="body2" sx={{ color: '#8b949e', mt: 1, '@media print': { color: '#555' } }}>
                Date: {new Date(order.created_at).toLocaleString()}
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ borderColor: '#21262d', mb: 4, '@media print': { borderColor: '#ccc' } }} />

          {/* Customer / Billing details */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#8b949e', mb: 1, '@media print': { color: '#555' } }}>
              Billed To:
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#f0f6fc', '@media print': { color: '#000' } }}>
              {order.customer_name}
            </Typography>
            {/* Show phone number if available */}
            <Typography variant="body2" sx={{ color: '#8b949e', mt: 0.5, '@media print': { color: '#555' } }}>
              Customer Account ID: #{order.customer_id}
            </Typography>
          </Box>

          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#8b949e', mb: 2, '@media print': { color: '#555' } }}>
            Order Summary:
          </Typography>

          {/* Products List Table */}
          <TableContainer component={Paper} sx={{ bgcolor: '#0d1117', border: '1px solid #21262d', mb: 4, '@media print': { bgcolor: 'transparent', borderColor: '#ccc' } }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product Item</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell sx={{ fontWeight: 600, color: '#f0f6fc', '@media print': { color: '#000' } }}>
                      {item.product_name}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', color: '#8b949e', '@media print': { color: '#555' } }}>
                      {item.sku}
                    </TableCell>
                    <TableCell align="right" sx={{ '@media print': { color: '#000' } }}>
                      ₹{item.unit_price != null ? parseFloat(item.unit_price).toFixed(2) : '0.00'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, '@media print': { color: '#000' } }}>
                      {item.quantity}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#58a6ff', '@media print': { color: '#000' } }}>
                      ₹{item.unit_price != null ? (parseFloat(item.unit_price) * item.quantity).toFixed(2) : '0.00'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Total Cost card block */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Card sx={{ minWidth: 260, bgcolor: '#0d1117', border: '1px solid #21262d', '@media print': { bgcolor: 'transparent', borderColor: '#ccc' } }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, py: '20px !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#8b949e', '@media print': { color: '#555' } }}>Subtotal:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#f0f6fc', '@media print': { color: '#000' } }}>
                    ₹{order.total_amount != null ? parseFloat(order.total_amount).toFixed(2) : '0.00'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#8b949e', '@media print': { color: '#555' } }}>Sales Tax (0%):</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#f0f6fc', '@media print': { color: '#000' } }}>₹0.00</Typography>
                </Box>
                <Divider sx={{ borderColor: '#21262d', my: 0.5, '@media print': { borderColor: '#ccc' } }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontWeight: 700, color: '#f0f6fc', '@media print': { color: '#000' } }}>Grand Total:</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#3fb950', fontFamily: "'Outfit', sans-serif", '@media print': { color: '#000' } }}>
                    ₹{order.total_amount != null ? parseFloat(order.total_amount).toFixed(2) : '0.00'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
