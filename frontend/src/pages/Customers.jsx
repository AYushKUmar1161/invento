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
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  DialogContentText,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import api, { getErrorMessage } from '../services/api';
import { useNotification } from '../context/NotificationContext';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  // Dialog states
  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/customers', {
        params: search ? { search } : {}
      });
      setCustomers(response.data);
    } catch (err) {
      showNotification(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 400); // Debounce search
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenAdd = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormErrors({});
    setOpenForm(true);
  };

  const handleOpenDelete = (customer) => {
    setSelectedCustomer(customer);
    setOpenDelete(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formName.trim()) errors.name = 'Customer full name is required';
    if (!formEmail.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formEmail)) {
      errors.email = 'Please provide a valid email address';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveCustomer = async () => {
    if (!validateForm()) return;

    const payload = {
      full_name: formName,
      email: formEmail,
      phone_number: formPhone || null,
    };

    try {
      await api.post('/customers', payload);
      showNotification('Customer registered successfully!', 'success');
      setOpenForm(false);
      fetchCustomers();
    } catch (err) {
      showNotification(getErrorMessage(err), 'error');
    }
  };

  const handleDeleteCustomer = async () => {
    try {
      await api.delete(`/customers/${selectedCustomer.id}`);
      showNotification('Customer account deleted successfully!', 'success');
      setOpenDelete(false);
      fetchCustomers();
    } catch (err) {
      showNotification(getErrorMessage(err), 'error');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: '#f0f6fc' }}>
          Customer Registry
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          sx={{ py: 1.2, px: 3 }}
        >
          Add Customer
        </Button>
      </Box>

      {/* Search Input */}
      <Box sx={{ mb: 3 }}>
        <TextField
          placeholder="Search by customer name or email..."
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
      {loading && customers.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : customers.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', border: '1px solid #21262d', bgcolor: '#161b22' }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No customers registered
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Register your first client to start recording incoming transaction orders.
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={handleOpenAdd}>
            Register Customer
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ bgcolor: '#161b22', border: '1px solid #21262d', borderRadius: '10px' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Full Name</TableCell>
                <TableCell>Email Address</TableCell>
                <TableCell>Phone Number</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id} hover>
                  <TableCell sx={{ fontWeight: 600, color: '#f0f6fc' }}>{customer.full_name}</TableCell>
                  <TableCell sx={{ color: '#58a6ff' }}>{customer.email}</TableCell>
                  <TableCell sx={{ color: '#8b949e' }}>{customer.phone_number || '—'}</TableCell>
                  <TableCell align="center">
                    <IconButton color="error" onClick={() => handleOpenDelete(customer)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Registration Dialog */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #21262d', pb: 2 }}>
          Register New Customer
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            label="Full Name"
            fullWidth
            margin="dense"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            error={!!formErrors.name}
            helperText={formErrors.name}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Email Address"
            fullWidth
            margin="dense"
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            error={!!formErrors.email}
            helperText={formErrors.email}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Phone Number (Optional)"
            fullWidth
            margin="dense"
            value={formPhone}
            onChange={(e) => setFormPhone(e.target.value)}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, borderTop: '1px solid #21262d' }}>
          <Button onClick={() => setOpenForm(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSaveCustomer} variant="contained">
            Register
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Customer Record</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete customer <strong>{selectedCustomer?.full_name}</strong> ({selectedCustomer?.email})? Doing so will also delete all associated purchase orders.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenDelete(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteCustomer} color="error" variant="contained">
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
