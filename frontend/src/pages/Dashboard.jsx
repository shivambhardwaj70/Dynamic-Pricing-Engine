/**
 * src/pages/Dashboard.jsx
 * Phase F-6 will fill this in fully with KPI cards, charts and price history table.
 * This stub ensures the router works immediately after Phase F-1 install.
 */
import React from 'react';
import { Box, Typography, Card, CardContent, Grid } from '@mui/material';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import PageHeader from '../components/common/PageHeader';

export default function Dashboard() {
  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle="Executive overview of your Dynamic Pricing Engine"
      />

      {/* Placeholder content — Phase F-6 will replace this */}
      <Card
        sx={{
          border: '2px dashed #E2E8F0',
          boxShadow: 'none',
          backgroundColor: '#F8FAFC',
        }}
      >
        <CardContent sx={{ textAlign: 'center', py: 10 }}>
          <DashboardRoundedIcon sx={{ fontSize: 56, color: '#CBD5E1', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#94A3B8', mb: 1 }}>
            Dashboard — Coming in Phase F-6
          </Typography>
          <Typography variant="body2" sx={{ color: '#94A3B8', maxWidth: 400, mx: 'auto' }}>
            KPI metric cards, price history chart, and low-stock alerts will be built here.
            Use the sidebar to navigate to working pages.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

