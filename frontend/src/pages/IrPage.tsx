// src/pages/IrPage.tsx
import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { IncidentTable } from '../components/IncidentTable';
import { IncidentForm } from '../components/IncidentForm';
import { IncidentWorkflowDrawer } from '../components/IncidentWorkflowDrawer';

interface ModulePageProps {
  selectedBuId: number | '';
}

export const IrPage: React.FC<ModulePageProps> = ({ selectedBuId }) => {
  const [reloadToken, setReloadToken] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleIncidentCreated = () => {
    setReloadToken((prev) => prev + 1);
    setCreateOpen(false);
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h6" gutterBottom>
              Incident Reporting
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage and review incidents for the selected Business Unit.
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => setCreateOpen(true)}
            disabled={!selectedBuId}
          >
            New Incident
          </Button>
        </Stack>
      </Paper>

      {/* Incidents table */}
      <IncidentTable
        businessUnitId={selectedBuId}
        reloadToken={reloadToken}
        onOpenWorkflow={(incidentId) => {
          setSelectedIncidentId(incidentId);
          setWorkflowOpen(true);
        }}
        onViewReport={(incidentId) => {
          window.open(`/ir/report/${incidentId}`, '_blank');
        }}
      />

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ pb: 1 }}>New Incident</DialogTitle>
        <DialogContent sx={{ pt: 5, pb: 4 }}>
          <IncidentForm
            businessUnitId={selectedBuId}
            onCreated={handleIncidentCreated}
            onCancel={() => setCreateOpen(false)}
            variant="dialog"
            showTitle={false}
          />
        </DialogContent>
      </Dialog>

      <IncidentWorkflowDrawer
        open={workflowOpen}
        onClose={() => setWorkflowOpen(false)}
        incidentId={selectedIncidentId}
        onUpdated={() => setReloadToken((prev) => prev + 1)}
      />
    </Box>
  );
};
