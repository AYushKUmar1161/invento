import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Tooltip,
  Badge,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  ReceiptLong as ReceiptLongIcon,
  ChevronLeft as ChevronLeftIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';

const drawerWidth = 260;

export default function DashboardLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapse, setIsCollapse] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/dashboard');
      if (response.data && response.data.low_stock_products) {
        setLowStockProducts(response.data.low_stock_products);
      }
    } catch (err) {
      console.error("Failed to fetch low stock notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = () => {
    handleCloseMenu();
    navigate('/products');
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Products', icon: <InventoryIcon />, path: '/products' },
    { text: 'Customers', icon: <PeopleIcon />, path: '/customers' },
    { text: 'Orders', icon: <ReceiptLongIcon />, path: '/orders' },
  ];

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0b0f17' }}>
      {/* Sidebar Header Logo */}
      <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: [2], py: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #1f6feb 0%, #0d44a0 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: '1.2rem',
              boxShadow: '0 0 10px rgba(31, 111, 235, 0.4)',
            }}
          >
            📦
          </Box>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              color: '#f0f6fc',
              letterSpacing: '0.5px',
            }}
          >
            Invento
          </Typography>
        </Box>
        <IconButton onClick={() => setIsCollapse(!isCollapse)} sx={{ display: { xs: 'none', md: 'flex' }, color: 'grey.500' }}>
          <ChevronLeftIcon sx={{ transform: isCollapse ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
        </IconButton>
      </Toolbar>
      <Divider sx={{ borderColor: '#21262d' }} />
      
      {/* Menu List */}
      <List sx={{ px: 1.5, py: 2, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{
                  borderRadius: '10px',
                  py: 1.2,
                  px: 2,
                  bgcolor: active ? 'rgba(31, 111, 235, 0.15)' : 'transparent',
                  color: active ? '#58a6ff' : '#8b949e',
                  '&:hover': {
                    bgcolor: active ? 'rgba(31, 111, 235, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                    color: active ? '#58a6ff' : '#f0f6fc',
                    '& .MuiListItemIcon-root': {
                      color: active ? '#58a6ff' : '#f0f6fc',
                      transform: 'scale(1.05)'
                    }
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <ListItemIcon
                  sx={{
                    color: active ? '#58a6ff' : '#8b949e',
                    minWidth: 42,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!isCollapse && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: active ? 600 : 500,
                      fontSize: '0.95rem',
                      fontFamily: "'Inter', sans-serif"
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: '#21262d' }} />

      {/* Sidebar Footer Profile */}
      {!isCollapse && (
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: '#1f6feb', color: '#fff', fontWeight: 600 }}>SA</Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#f0f6fc', fontSize: '0.85rem' }}>
              Senior Admin
            </Typography>
            <Typography variant="body2" sx={{ color: '#8b949e', fontSize: '0.75rem' }}>
              admin@invento.com
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );

  const activePage = menuItems.find(item => location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)));
  const pageTitle = activePage ? activePage.text : 'Order Receipt';

  const currentDrawerWidth = isCollapse ? 70 : drawerWidth;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0b0f17' }}>
      <CssBaseline />
      
      {/* Top Navbar Header */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${currentDrawerWidth}px)` },
          ml: { md: `${currentDrawerWidth}px` },
          bgcolor: 'rgba(13, 17, 23, 0.7)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #21262d',
          boxShadow: 'none',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          transition: 'all 0.3s ease',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' }, color: '#f0f6fc' }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                color: '#f0f6fc',
                letterSpacing: '-0.3px',
              }}
            >
              {pageTitle}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Notifications">
              <IconButton onClick={handleOpenMenu} sx={{ color: '#8b949e' }}>
                <Badge badgeContent={lowStockProducts.length} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Notifications Dropdown Menu */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleCloseMenu}
              PaperProps={{
                sx: {
                  bgcolor: '#161b22',
                  border: '1px solid #30363d',
                  borderRadius: '10px',
                  width: 320,
                  maxHeight: 400,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  mt: 1.5,
                  '& .MuiMenuItem-root': {
                    borderBottom: '1px solid #21262d',
                    whiteSpace: 'normal',
                    py: 1.5,
                    px: 2,
                    '&:last-child': { borderBottom: 'none' },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' }
                  }
                }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ px: 2, py: 1.2, borderBottom: '1px solid #21262d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f0f6fc', fontFamily: "'Outfit', sans-serif" }}>
                  Low Inventory Alerts
                </Typography>
                <Chip 
                  label={`${lowStockProducts.length} alert(s)`} 
                  color={lowStockProducts.length > 0 ? 'error' : 'success'} 
                  size="small" 
                  sx={{ fontWeight: 600, fontSize: '0.7rem', height: 20 }} 
                />
              </Box>
              
              {lowStockProducts.length === 0 ? (
                <MenuItem disabled sx={{ justifyContent: 'center', py: 4 }}>
                  <Typography variant="body2" sx={{ color: '#8b949e', textAlign: 'center' }}>
                    🎉 All products are fully stocked!
                  </Typography>
                </MenuItem>
              ) : (
                lowStockProducts.map((product) => (
                  <MenuItem key={product.id} onClick={handleNotificationClick}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, width: '100%' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#f0f6fc', fontSize: '0.85rem' }}>
                        {product.name}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#8b949e', fontFamily: 'monospace' }}>
                          SKU: {product.sku}
                        </Typography>
                        <Chip
                          label={product.stock_quantity === 0 ? 'Out of Stock' : `${product.stock_quantity} left`}
                          size="small"
                          color={product.stock_quantity === 0 ? 'error' : 'warning'}
                          sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                        />
                      </Box>
                    </Box>
                  </MenuItem>
                ))
              )}
            </Menu>
            <Divider orientation="vertical" variant="middle" flexItem sx={{ borderColor: '#21262d', my: 1.5 }} />
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#8b949e', cursor: 'pointer' }} />
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer Components */}
      <Box
        component="nav"
        sx={{ width: { md: currentDrawerWidth }, flexShrink: { md: 0 }, transition: 'all 0.3s ease' }}
      >
        {/* Mobile Drawer (Responsive) */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid #21262d' },
          }}
        >
          {drawerContent}
        </Drawer>
        
        {/* Desktop Drawer (Permanent) */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: currentDrawerWidth,
              borderRight: '1px solid #21262d',
              transition: 'all 0.3s ease',
              overflowX: 'hidden'
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2.5, sm: 4 },
          width: { md: `calc(100% - ${currentDrawerWidth}px)` },
          minHeight: '100vh',
          pt: { xs: 9, sm: 10 },
          transition: 'all 0.3s ease',
          bgcolor: '#0d1117'
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
