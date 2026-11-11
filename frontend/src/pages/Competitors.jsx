/**
 * src/pages/Competitors.jsx
 * Phase F-4 will build competitor feeds, add-competitor form, and comparison cards.
 */
import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded';
import PageHeader from '../components/common/PageHeader';

export default function Competitors() {
  return (
    <Box>
      <PageHeader
        title="Competitor Pricing"
        subtitle="Monitor market feeds and compare competitor prices"
      />
      <Card sx={{ border: '2px dashed #E2E8F0', boxShadow: 'none', backgroundColor: '#F8FAFC' }}>
        <CardContent sx={{ textAlign: 'center', py: 10 }}>
          <CompareArrowsRoundedIcon sx={{ fontSize: 56, color: '#CBD5E1', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#94A3B8', mb: 1 }}>
            Competitor Pricing — Coming in Phase F-4
          </Typography>
          <Typography variant="body2" sx={{ color: '#94A3B8', maxWidth: 400, mx: 'auto' }}>
            Competitor price feeds, comparison cards showing price differences and market position.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

