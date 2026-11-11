/**
 * src/pages/Products.jsx
 * Phase F-2 will build the full CRUD product table + Add/Edit/Delete modals.
 */
import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import PageHeader from '../components/common/PageHeader';

export default function Products() {
  return (
    <Box>
      <PageHeader
        title="Product Catalog"
        subtitle="Manage and monitor your complete product listing"
      />
      <Card sx={{ border: '2px dashed #E2E8F0', boxShadow: 'none', backgroundColor: '#F8FAFC' }}>
        <CardContent sx={{ textAlign: 'center', py: 10 }}>
          <StorefrontRoundedIcon sx={{ fontSize: 56, color: '#CBD5E1', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#94A3B8', mb: 1 }}>
            Product Catalog — Coming in Phase F-2
          </Typography>
          <Typography variant="body2" sx={{ color: '#94A3B8', maxWidth: 400, mx: 'auto' }}>
            Product table with Add, Edit, and Delete actions connected to the backend.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

