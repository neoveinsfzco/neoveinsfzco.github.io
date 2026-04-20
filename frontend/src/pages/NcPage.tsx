// src/pages/NcPage.tsx
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
import { NonConformanceTable } from '../components/NonConformanceTable';
import { NonConformanceForm } from '../components/NonConformanceForm';
import { NonConformanceWorkflowDrawer } from '../components/NonConformanceWorkflowDrawer';

interface ModulePageProps {
  selectedBuId: number | '';
}

export const NcPage: React.FC<ModulePageProps> = ({ selectedBuId }) => {
  const [reloadToken, setReloadToken] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [selectedNcId, setSelectedNcId] = useState<number | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleCreated = () => {
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
              Non-Conformance
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track and review non-conformances and CAPA for the selected Business Unit.
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => setCreateOpen(true)}
            disabled={!selectedBuId}
          >
            New Non-Conformance
          </Button>
        </Stack>
      </Paper>

      <NonConformanceTable
        businessUnitId={selectedBuId}
        reloadToken={reloadToken}
        onOpenWorkflow={(ncId) => {
          setSelectedNcId(ncId);
          setWorkflowOpen(true);
        }}
      />

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>New Non-Conformance</DialogTitle>
        <DialogContent>
          <NonConformanceForm
            businessUnitId={selectedBuId}
            onCreated={handleCreated}
            onCancel={() => setCreateOpen(false)}
            variant="dialog"
            showTitle={false}
          />
        </DialogContent>
      </Dialog>

      <NonConformanceWorkflowDrawer
        open={workflowOpen}
        onClose={() => setWorkflowOpen(false)}
        nonConformanceId={selectedNcId}
        onUpdated={() => setReloadToken((prev) => prev + 1)}
      />
    </Box>
  );
};
