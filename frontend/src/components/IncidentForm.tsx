// src/components/IncidentForm.tsx
import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import api from '../api/client';

interface IncidentFormProps {
  businessUnitId: number | '';
  onCreated?: () => void;
  variant?: 'panel' | 'dialog';
  onCancel?: () => void;
  showTitle?: boolean;
}

export const IncidentForm: React.FC<IncidentFormProps> = ({
  businessUnitId,
  onCreated,
  variant = 'panel',
  onCancel,
  showTitle = true,
}) => {
  const [incidentDate, setIncidentDate] = useState(''); // datetime-local string
  const [description, setDescription] = useState('');
  const [incidentTypeId, setIncidentTypeId] = useState<number | ''>('');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [designation, setDesignation] = useState('');
  const [witnessName, setWitnessName] = useState('');
  const [incidentTypes, setIncidentTypes] = useState<Array<{ id: number; name: string }>>([]);
  const [departments, setDepartments] = useState<Array<{ id: number; name: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [immediateActions, setImmediateActions] = useState<
    Array<{
      no: number;
      action: string;
      responsible: string;
      date: string;
      status: string;
    }>
  >([{ no: 1, action: '', responsible: '', date: '', status: '' }]);

  useEffect(() => {
    if (!businessUnitId) {
      setIncidentTypes([]);
      setDepartments([]);
      return;
    }

    const fetchSettings = async () => {
      try {
        const [typeRes, deptRes] = await Promise.all([
          api.get('ir/incident-types/', {
            params: { business_unit: businessUnitId, page_size: 1000 },
          }),
          api.get('departments/', {
            params: { business_unit: businessUnitId, page_size: 1000 },
          }),
        ]);
        setIncidentTypes(typeRes.data.results || []);
        setDepartments(deptRes.data.results || []);
      } catch (err) {
        console.error('Error loading IR settings', err);
      }
    };

    fetchSettings();
  }, [businessUnitId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!businessUnitId) {
      setError('Please select a Business Unit first.');
      return;
    }
    if (!description) {
      setError('Please fill all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        business_unit: businessUnitId,
        incident_date: incidentDate
          ? new Date(incidentDate).toISOString()
          : new Date().toISOString(),
        description,
        incident_type: incidentTypeId || null,
        department: departmentId || null,
        reported_by_designation: designation.trim(),
        witness_name: witnessName.trim(),
        immediate_actions_data: immediateActions,
        // reported_by: will stay null for now (no auth yet)
        // status: defaults to "Open" in the model
      };

      await api.post('ir/incidents/', payload);

      // Clear form
      setIncidentDate('');
      setDescription('');
      setIncidentTypeId('');
      setDepartmentId('');
      setDesignation('');
      setWitnessName('');
      setImmediateActions([{ no: 1, action: '', responsible: '', date: '', status: '' }]);

      if (onCreated) {
        onCreated();
      }
    } catch (err: any) {
      console.error('Error creating incident', err);
      setError('Failed to create incident. Check console for details.');
    } finally {
      setSubmitting(false);
    }
  };

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    variant === 'panel' ? <Paper sx={{ p: 2, mb: 2 }}>{children}</Paper> : <Box>{children}</Box>;

  return (
    <Wrapper>
      {showTitle && (
        <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
          New Incident
        </Typography>
      )}
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2, mt: 1 }}>
          <TextField
            select
            label="Department"
            size="small"
            fullWidth
            value={departmentId}
            onChange={(e) =>
              setDepartmentId(e.target.value ? Number(e.target.value) : '')
            }
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {departments.map((dept) => (
              <MenuItem key={dept.id} value={dept.id}>
                {dept.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Incident Type"
            size="small"
            fullWidth
            value={incidentTypeId}
            onChange={(e) =>
              setIncidentTypeId(e.target.value ? Number(e.target.value) : '')
            }
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {incidentTypes.map((type) => (
              <MenuItem key={type.id} value={type.id}>
                {type.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Incident date & time"
            type="datetime-local"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={incidentDate}
            onChange={(e) => setIncidentDate(e.target.value)}
          />
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            label="Reporter designation"
            size="small"
            fullWidth
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
          />
          <TextField
            label="Witness (optional)"
            size="small"
            fullWidth
            value={witnessName}
            onChange={(e) => setWitnessName(e.target.value)}
          />
        </Stack>

        <TextField
          label="Description"
          size="small"
          required
          fullWidth
          multiline
          minRows={3}
          sx={{ mb: 2 }}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Immediate Actions
          </Typography>
          <Stack spacing={1}>
            {immediateActions.map((row, index) => (
              <Stack
                key={row.no}
                direction={{ xs: 'column', md: 'row' }}
                spacing={1}
              >
                <TextField
                  label="No"
                  size="small"
                  value={row.no}
                  sx={{ maxWidth: 80 }}
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="Action"
                  size="small"
                  fullWidth
                  value={row.action}
                  onChange={(e) => {
                    const next = [...immediateActions];
                    next[index].action = e.target.value;
                    setImmediateActions(next);
                  }}
                />
                <TextField
                  label="Responsible"
                  size="small"
                  fullWidth
                  value={row.responsible}
                  onChange={(e) => {
                    const next = [...immediateActions];
                    next[index].responsible = e.target.value;
                    setImmediateActions(next);
                  }}
                />
                <TextField
                  label="Date"
                  size="small"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={row.date}
                  onChange={(e) => {
                    const next = [...immediateActions];
                    next[index].date = e.target.value;
                    setImmediateActions(next);
                  }}
                  sx={{ minWidth: 150 }}
                />
                <TextField
                  label="Status"
                  size="small"
                  fullWidth
                  value={row.status}
                  onChange={(e) => {
                    const next = [...immediateActions];
                    next[index].status = e.target.value;
                    setImmediateActions(next);
                  }}
                />
                <Button
                  size="small"
                  color="error"
                  onClick={() => {
                    const next = immediateActions.filter((_, i) => i !== index);
                    const reindexed = next.map((item, i) => ({
                      ...item,
                      no: i + 1,
                    }));
                    setImmediateActions(reindexed.length ? reindexed : [{ no: 1, action: '', responsible: '', date: '', status: '' }]);
                  }}
                >
                  Remove
                </Button>
              </Stack>
            ))}
            <Button
              size="small"
              variant="outlined"
              onClick={() =>
                setImmediateActions((prev) => [
                  ...prev,
                  {
                    no: prev.length + 1,
                    action: '',
                    responsible: '',
                    date: '',
                    status: '',
                  },
                ])
              }
            >
              Add Action
            </Button>
          </Stack>
        </Paper>

        {error && (
          <Typography variant="body2" color="error" sx={{ mb: 1 }}>
            {error}
          </Typography>
        )}

        <Stack direction="row" spacing={1}>
          {onCancel && (
            <Button onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Incident'}
          </Button>
        </Stack>
      </Box>
    </Wrapper>
  );
};
