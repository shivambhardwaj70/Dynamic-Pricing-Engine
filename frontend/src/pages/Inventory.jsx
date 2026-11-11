/**
 * src/pages/Inventory.jsx
 * Phase F-3 will build stock level table with status badges and inline update.
 */
import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import PageHeader from '../components/common/PageHeader';

export default function Inventory() {
  return (
    <Box>
      <PageHeader
        title="Inventory Management"
        subtitle="Monitor stock levels and update quantities in real time"
      />
      <Card sx={{ border: '2px dashed #E2E8F0', boxShadow: 'none', backgroundColor: '#F8FAFC' }}>
        <CardContent sx={{ textAlign: 'center', py: 10 }}>
          <Inventory2RoundedIcon sx={{ fontSize: 56, color: '#CBD5E1', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#94A3B8', mb: 1 }}>
            Inventory Management — Coming in Phase F-3
          </Typography>
          <Typography variant="body2" sx={{ color: '#94A3B8', maxWidth: 400, mx: 'auto' }}>
            Stock table with Low/High/Normal status badges and quick-update dialogs.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

