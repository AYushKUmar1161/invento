import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
  Alert,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  People as PeopleIcon,
  ReceiptLong as ReceiptLongIcon,
  WarningAmber as WarningIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import api, { getErrorMessage } from '../services/api';
import { useNotification } from '../context/NotificationContext';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/dashboard');
      setStats(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
      showNotification('Failed to fetch dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={50} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="contained" onClick={fetchDashboardData}>Retry Load</Button>
      </Box>
    );
  }

  const statCards = [
    {
      title: 'Total Products',
      value: stats?.total_products || 0,
      icon: <InventoryIcon sx={{ fontSize: 40, color: '#1f6feb' }} />,
      bgColor: 'rgba(31, 111, 235, 0.1)',
      borderColor: 'rgba(31, 111, 235, 0.3)',
      path: '/products'
    },
    {
      title: 'Total Customers',
      value: stats?.total_customers || 0,
      icon: <PeopleIcon sx={{ fontSize: 40, color: '#3fb950' }} />,
      bgColor: 'rgba(63, 185, 80, 0.1)',
      borderColor: 'rgba(63, 185, 80, 0.3)',
      path: '/customers'
    },
    {
      title: 'Total Orders',
      value: stats?.total_orders || 0,
      icon: <ReceiptLongIcon sx={{ fontSize: 40, color: '#a371f7' }} />,
      bgColor: 'rgba(163, 113, 247, 0.1)',
      borderColor: 'rgba(163, 113, 247, 0.3)',
      path: '/orders'
    }
  ];

  return (
    <Box>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 700,
          mb: 4,
          color: '#f0f6fc',
        }}
      >
        Welcome back, Admin 👋
      </Typography>

      {/* KPI Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={4} key={card.title}>
            <Card
              className="glow-card"
              sx={{
                height: '100%',
                cursor: 'pointer',
                borderColor: card.borderColor,
                transition: 'all 0.3s ease',
                bgcolor: '#161b22',
              }}
              onClick={() => navigate(card.path)}
            >
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 3 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ color: '#8b949e', fontWeight: 500, mb: 1 }}>
                    {card.title}
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#f0f6fc', fontFamily: "'Outfit', sans-serif" }}>
                    {card.value}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 70,
                    height: 70,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: card.bgColor,
                  }}
                >
                  {card.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Low Stock Alerts */}
      <Card sx={{ border: '1px solid #21262d' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <WarningIcon sx={{ color: '#f0883e' }} />
              <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: '#f0f6fc' }}>
                Low Stock Alerts
              </Typography>
            </Box>
            <Chip
              label={`${stats?.low_stock_products?.length || 0} Alert(s)`}
              color={stats?.low_stock_products?.length > 0 ? 'error' : 'success'}
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Box>

          {(!stats?.low_stock_products || stats.low_stock_products.length === 0) ? (
            <Alert severity="success" sx={{ border: '1px solid rgba(63, 185, 80, 0.3)', bgcolor: 'rgba(63, 185, 80, 0.05)' }}>
              All inventory items are sufficiently stocked! Excellent!
            </Alert>
          ) : (
            <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none', border: '1px solid #21262d' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product Name</TableCell>
                    <TableCell>SKU</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Current Stock</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.low_stock_products.map((product) => (
                    <TableRow key={product.id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.01)' } }}>
                      <TableCell sx={{ fontWeight: 600, color: '#f0f6fc' }}>{product.name}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', color: '#8b949e' }}>{product.sku}</TableCell>
                      <TableCell align="right">₹{product.price != null ? parseFloat(product.price).toFixed(2) : '0.00'}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${product.stock_quantity} left`}
                          size="small"
                          color={product.stock_quantity === 0 ? 'error' : 'warning'}
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="text"
                          color="primary"
                          endIcon={<ArrowForwardIcon />}
                          onClick={() => navigate('/products')}
                          sx={{ fontSize: '0.85rem' }}
                        >
                          Restock
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
