// src/components/NonConformanceForm.tsx
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

interface NonConformanceFormProps {
  businessUnitId: number | '';
  onCreated?: () => void;
  variant?: 'panel' | 'dialog';
  onCancel?: () => void;
  showTitle?: boolean;
}

export const NonConformanceForm: React.FC<NonConformanceFormProps> = ({
  businessUnitId,
  onCreated,
  variant = 'panel',
  onCancel,
  showTitle = true,
}) => {
  const [description, setDescription] = useState('');
  const [classification, setClassification] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('Raised');
  const [occurrenceId, setOccurrenceId] = useState<number | ''>('');
  const [sourceId, setSourceId] = useState<number | ''>('');
  const [ncTypeId, setNcTypeId] = useState<number | ''>('');
  const [severityOptionId, setSeverityOptionId] = useState<number | ''>('');
  const [probabilityOptionId, setProbabilityOptionId] = useState<number | ''>('');
  const [riskRatingOptionId, setRiskRatingOptionId] = useState<number | ''>('');
  const [occurrences, setOccurrences] = useState<Array<{ id: number; name: string }>>([]);
  const [sources, setSources] = useState<Array<{ id: number; name: string }>>([]);
  const [types, setTypes] = useState<Array<{ id: number; name: string }>>([]);
  const [severities, setSeverities] = useState<Array<{ id: number; name: string }>>([]);
  const [probabilities, setProbabilities] = useState<Array<{ id: number; name: string }>>([]);
  const [riskRatings, setRiskRatings] = useState<Array<{ id: number; name: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessUnitId) {
      setOccurrences([]);
      setSources([]);
      setTypes([]);
      setSeverities([]);
      setProbabilities([]);
      setRiskRatings([]);
      return;
    }

    const fetchSettings = async () => {
      try {
        const [
          occRes,
          srcRes,
          typeRes,
          sevRes,
          probRes,
          riskRes,
        ] = await Promise.all([
          api.get('nc/occurrences/', {
            params: { business_unit: businessUnitId, page_size: 1000 },
          }),
          api.get('nc/sources/', {
            params: { business_unit: businessUnitId, page_size: 1000 },
          }),
          api.get('nc/types/', {
            params: { business_unit: businessUnitId, page_size: 1000 },
          }),
          api.get('nc/severities/', {
            params: { business_unit: businessUnitId, page_size: 1000 },
          }),
          api.get('nc/probabilities/', {
            params: { business_unit: businessUnitId, page_size: 1000 },
          }),
          api.get('nc/risk-ratings/', {
            params: { business_unit: businessUnitId, page_size: 1000 },
          }),
        ]);
        setOccurrences(occRes.data.results || []);
        setSources(srcRes.data.results || []);
        setTypes(typeRes.data.results || []);
        setSeverities(sevRes.data.results || []);
        setProbabilities(probRes.data.results || []);
        setRiskRatings(riskRes.data.results || []);
      } catch (err) {
        console.error('Error loading NC settings', err);
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
        description,
        classification,
        status,
        occurrence_place: occurrenceId || null,
        source: sourceId || null,
        nc_type: ncTypeId || null,
        severity_option: severityOptionId || null,
        probability_option: probabilityOptionId || null,
        risk_rating_option: riskRatingOptionId || null,
        due_date: dueDate || null,
      };

      await api.post('nc/nonconformances/', payload);

      setDescription('');
      setClassification('');
      setDueDate('');
      setStatus('Raised');
      setOccurrenceId('');
      setSourceId('');
      setNcTypeId('');
      setSeverityOptionId('');
      setProbabilityOptionId('');
      setRiskRatingOptionId('');

      if (onCreated) {
        onCreated();
      }
    } catch (err) {
      console.error('Error creating non-conformance', err);
      setError('Failed to create non-conformance. Check console for details.');
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
          New Non-Conformance
        </Typography>
      )}
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2, mt: 1 }}>
          <TextField
            select
            label="Occurrence Place"
            size="small"
            fullWidth
            value={occurrenceId}
            onChange={(e) =>
              setOccurrenceId(e.target.value ? Number(e.target.value) : '')
            }
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {occurrences.map((occ) => (
              <MenuItem key={occ.id} value={occ.id}>
                {occ.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Source"
            size="small"
            fullWidth
            value={sourceId}
            onChange={(e) =>
              setSourceId(e.target.value ? Number(e.target.value) : '')
            }
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {sources.map((src) => (
              <MenuItem key={src.id} value={src.id}>
                {src.name}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            select
            label="Non-Conformance Type"
            size="small"
            fullWidth
            value={ncTypeId}
            onChange={(e) =>
              setNcTypeId(e.target.value ? Number(e.target.value) : '')
            }
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {types.map((type) => (
              <MenuItem key={type.id} value={type.id}>
                {type.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Classification"
            size="small"
            fullWidth
            value={classification}
            onChange={(e) => setClassification(e.target.value)}
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

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            label="Due Date"
            type="date"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <TextField
            select
            label="Status"
            size="small"
            fullWidth
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <MenuItem value="Raised">Raised</MenuItem>
            <MenuItem value="Logged">Logged</MenuItem>
            <MenuItem value="Assigned">Assigned</MenuItem>
            <MenuItem value="RCA">RCA</MenuItem>
            <MenuItem value="CAPA Implemented">CAPA Implemented</MenuItem>
            <MenuItem value="Verified">Verified</MenuItem>
            <MenuItem value="Closed">Closed</MenuItem>
          </TextField>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            select
            label="Severity"
            size="small"
            fullWidth
            value={severityOptionId}
            onChange={(e) =>
              setSeverityOptionId(e.target.value ? Number(e.target.value) : '')
            }
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {severities.map((sev) => (
              <MenuItem key={sev.id} value={sev.id}>
                {sev.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Probability"
            size="small"
            fullWidth
            value={probabilityOptionId}
            onChange={(e) =>
              setProbabilityOptionId(e.target.value ? Number(e.target.value) : '')
            }
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {probabilities.map((prob) => (
              <MenuItem key={prob.id} value={prob.id}>
                {prob.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Risk Rating"
            size="small"
            fullWidth
            value={riskRatingOptionId}
            onChange={(e) =>
              setRiskRatingOptionId(e.target.value ? Number(e.target.value) : '')
            }
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {riskRatings.map((risk) => (
              <MenuItem key={risk.id} value={risk.id}>
                {risk.name}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

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
            {submitting ? 'Creating...' : 'Create Non-Conformance'}
          </Button>
        </Stack>
      </Box>
    </Wrapper>
  );
};
