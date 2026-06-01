import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '65vh',
        textAlign: 'center',
        px: 2
      }}
    >
      <Box
        sx={{
          fontSize: '6rem',
          mb: 2,
          animation: 'pulseGlow 2s infinite',
          lineHeight: 1
        }}
      >
        🔍
      </Box>
      <Typography
        variant="h3"
        sx={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 800,
          mb: 2,
          color: '#f0f6fc'
        }}
      >
        404 - Page Not Found
      </Typography>
      <Typography
        variant="body1"
        sx={{
          color: '#8b949e',
          maxWidth: 480,
          mb: 4
        }}
      >
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </Typography>
      <Button
        variant="contained"
        startIcon={<HomeIcon />}
        onClick={() => navigate('/')}
        sx={{ py: 1.2, px: 3 }}
      >
        Back to Dashboard
      </Button>
    </Box>
  );
}
