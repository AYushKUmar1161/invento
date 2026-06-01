import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { NotificationProvider } from './context/NotificationContext';
import DashboardLayout from './layouts/DashboardLayout';

// Import Pages (we will create these next)
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import NotFound from './pages/NotFound';

// Customize our modern, premium dark theme palette
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1f6feb',      // Modern electric blue
      light: '#58a6ff',
      dark: '#0d44a0',
    },
    secondary: {
      main: '#238636',      // Premium green
      light: '#3fb950',
      dark: '#1b602a',
    },
    error: {
      main: '#da3633',      // Vibrant red
      light: '#f85149',
    },
    warning: {
      main: '#d29922',      // Gold/Amber
      light: '#f0883e',
    },
    background: {
      default: '#0d1117',   // Deep slate
      paper: '#161b22',     // Lighter slate cards
    },
    text: {
      primary: '#f0f6fc',   // Off-white
      secondary: '#8b949e', // Steel gray
    },
    divider: '#21262d',
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    h1: { fontFamily: "'Outfit', sans-serif", fontWeight: 700 },
    h2: { fontFamily: "'Outfit', sans-serif", fontWeight: 700 },
    h3: { fontFamily: "'Outfit', sans-serif", fontWeight: 600 },
    h4: { fontFamily: "'Outfit', sans-serif", fontWeight: 600 },
    h5: { fontFamily: "'Outfit', sans-serif", fontWeight: 600 },
    h6: { fontFamily: "'Outfit', sans-serif", fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 500 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #1f6feb 0%, #0d44a0 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#161b22',
          border: '1px solid #21262d',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#161b22',
          backgroundImage: 'none',
          border: '1px solid #30363d',
          borderRadius: 12,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#0d1117',
          '& .MuiTableCell-root': {
            fontWeight: 600,
            color: '#c9d1d9',
            borderColor: '#21262d',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#21262d',
        },
      },
    },
  },
});

export default function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <NotificationProvider>
        <Router>
          <DashboardLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:id" element={<OrderDetails />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </DashboardLayout>
        </Router>
      </NotificationProvider>
    </ThemeProvider>
  );
}
