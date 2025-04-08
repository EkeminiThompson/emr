import React from 'react';
import { Box, Typography, Link, Container } from '@mui/material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        padding: '16px 0',
        backgroundColor: '#1976d2',
        color: '#fff',
        textAlign: 'center',
        mt: 4,
      }}
    >
      <Container>
        <Typography variant="body2" sx={{ fontSize: '0.85rem', mb: 1 }}>
          &copy; {new Date().getFullYear()} <strong>Renewal Ridge EMR</strong>. All rights reserved.
        </Typography>
        <Box>
          <Link href="/terms" color="inherit" sx={{ fontSize: '0.85rem', mr: 2 }}>
            Terms
          </Link>
          <Link href="/privacy-policy" color="inherit" sx={{ fontSize: '0.85rem' }}>
            Privacy
          </Link>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
