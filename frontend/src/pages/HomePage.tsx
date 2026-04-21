// src/pages/HomePage.tsx
import { Box, Button, Card, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { BusinessUnitSelector } from '../components/BusinessUnitSelector';
import type { BusinessUnit } from '../types/BusinessUnit';
import logo from '../assets/NQM7-nobackground-3.png';

interface HomePageProps {
  selectedBuId: number | '';
  selectedBuName: string | null;
  onChangeBu: (id: number | '', bu: BusinessUnit | null) => void;
}

export function HomePage({
  selectedBuId,
  selectedBuName,
  onChangeBu,
}: HomePageProps) {
  const hasBu = selectedBuId !== '';

  return (
    <Box>
      <Box
              component="img"
              sx={{ height: 140, width: 140, objectFit: 'contain' }}
              alt="NQM logo"
              src={logo}
            />
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Welcome to NQM
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage your documents, incidents, and non-conformances in one place.
      </Typography>

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 2 }}>
          {hasBu
            ? `Business Unit: ${selectedBuName ?? selectedBuId}`
            : 'Select a Business Unit to get started'}
        </Typography>

        <BusinessUnitSelector value={selectedBuId} onChange={onChangeBu} />

        {!hasBu && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Once you select a Business Unit, available modules will appear below.
          </Typography>
        )}

        {hasBu && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Modules
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                component={RouterLink}
                to="/dms"
                variant="contained"
                color="primary"
              >
                DMS
              </Button>
              <Button
                component={RouterLink}
                to="/ir"
                variant="outlined"
                color="primary"
              >
                IR
              </Button>
              <Button
                component={RouterLink}
                to="/nc"
                variant="outlined"
                color="primary"
              >
                NC
              </Button>
              <Button
                component={RouterLink}
                to="/training"
                variant="outlined"
                color="primary"
              >
                Training
              </Button>
            </Stack>
          </Box>
        )}
      </Card>
    </Box>
  );
}
