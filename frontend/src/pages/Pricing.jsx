/**
 * src/pages/Pricing.jsx
 * Phase F-5 will build the full Pricing Recommendation engine UI — the star demo page.
 */
import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import AutoGraphRoundedIcon from '@mui/icons-material/AutoGraphRounded';
import PageHeader from '../components/common/PageHeader';

export default function Pricing() {
  return (
    <Box>
      <PageHeader
        title="Pricing Recommendation Engine"
        subtitle="⭐ Primary Demo Page — Generate AI-powered dynamic price recommendations"
      />
      <Card sx={{ border: '2px dashed #E2E8F0', boxShadow: 'none', backgroundColor: '#F8FAFC' }}>
        <CardContent sx={{ textAlign: 'center', py: 10 }}>
          <AutoGraphRoundedIcon sx={{ fontSize: 56, color: '#CBD5E1', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#94A3B8', mb: 1 }}>
            Pricing Engine UI — Coming in Phase F-5
          </Typography>
          <Typography variant="body2" sx={{ color: '#94A3B8', maxWidth: 400, mx: 'auto' }}>
            Product selector + demand toggle → Rule Engine breakdown cards + AI Explanation box.
            This is the primary demo page for the project presentation.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

