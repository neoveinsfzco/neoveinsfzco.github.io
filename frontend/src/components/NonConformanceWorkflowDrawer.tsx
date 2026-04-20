import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import api from '../api/client';
import { WorkflowStatusChips } from './WorkflowStatusChips';

interface NonConformanceWorkflowDrawerProps {
  open: boolean;
  onClose: () => void;
  nonConformanceId: number | null;
  onUpdated?: () => void;
}

interface NonConformanceDetail {
  id: number;
  reference: string;
  status: string;
  raised_by_username?: string;
  date_raised?: string;
  description?: string;
  corrective_action?: string;
  preventive_action?: string;
  due_date?: string;
}

const STATUS_STEPS = [
  'Raised',
  'Logged',
  'Assigned',
  'RCA',
  'CAPA Implemented',
  'Verified',
  'Closed',
];

export const NonConformanceWorkflowDrawer: React.FC<
  NonConformanceWorkflowDrawerProps
> = ({ open, onClose, nonConformanceId, onUpdated }) => {
  const [nc, setNc] = useState<NonConformanceDetail | null>(null);
  const [status, setStatus] = useState('Raised');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [preventiveAction, setPreventiveAction] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayRaisedAt = useMemo(() => {
    if (!nc?.date_raised) {
      return '-';
    }
    return new Date(nc.date_raised).toLocaleString();
  }, [nc?.date_raised]);

  const fetchNc = async () => {
    if (!nonConformanceId) {
      setNc(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<NonConformanceDetail>(
        `nc/nonconformances/${nonConformanceId}/`,
      );
      setNc(res.data);
      setStatus(res.data.status || 'Raised');
      setCorrectiveAction(res.data.corrective_action || '');
      setPreventiveAction(res.data.preventive_action || '');
      setDueDate(res.data.due_date || '');
    } catch (err) {
      console.error('Error loading non-conformance workflow', err);
      setError('Unable to load the non-conformance details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && nonConformanceId) {
      fetchNc();
    }
  }, [open, nonConformanceId]);

  const handleSave = async () => {
    if (!nonConformanceId) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.patch(`nc/nonconformances/${nonConformanceId}/`, {
        status,
        corrective_action: correctiveAction,
        preventive_action: preventiveAction,
        due_date: dueDate || null,
      });
      await fetchNc();
      onUpdated?.();
    } catch (err: any) {
      console.error('Error updating non-conformance workflow', err);
      if (err.response?.status === 403) {
        setError('You do not have permission to move this NC to that status.');
      } else {
        setError('Failed to update the non-conformance workflow.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 460, md: 520 },
          p: 2,
          pt: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        },
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="subtitle1">NC Workflow</Typography>
          <Typography variant="body2" color="text.secondary">
            {nc?.reference || 'No non-conformance selected'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />

      {loading ? (
        <Typography variant="body2" color="text.secondary">
          Loading workflow...
        </Typography>
      ) : (
        <>
          <Stack spacing={0.5}>
            <Typography variant="body2">
              Raised by: {nc?.raised_by_username || '-'}
            </Typography>
            <Typography variant="body2">Raised at: {displayRaisedAt}</Typography>
          </Stack>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Workflow Progress
            </Typography>
            <WorkflowStatusChips steps={STATUS_STEPS} current={status} />
          </Box>

          <Divider />

          <Stack spacing={2}>
            <TextField
              select
              label="Status"
              size="small"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_STEPS.map((step) => (
                <MenuItem key={step} value={step}>
                  {step}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Corrective action"
              multiline
              minRows={2}
              value={correctiveAction}
              onChange={(e) => setCorrectiveAction(e.target.value)}
            />
            <TextField
              label="Preventive action"
              multiline
              minRows={2}
              value={preventiveAction}
              onChange={(e) => setPreventiveAction(e.target.value)}
            />
            <TextField
              label="Due date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={dueDate || ''}
              onChange={(e) => setDueDate(e.target.value)}
            />

            {error && (
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            )}

            <Button variant="contained" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Workflow'}
            </Button>
          </Stack>
        </>
      )}
    </Drawer>
  );
};
