import { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import api from '../api/client';

export const IncidentReportPage: React.FC = () => {
  const { incidentId } = useParams();
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!incidentId) {
      setError('Missing incident id.');
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get(`ir/incidents/${incidentId}/report/`, { responseType: 'text' })
      .then((res) => {
        setHtml(res.data as unknown as string);
      })
      .catch((err) => {
        console.error('Failed to load incident report', err);
        setError('Unable to load the incident report.');
      })
      .finally(() => setLoading(false));
  }, [incidentId]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#e2e8f0' }}>
      <Box
        component="iframe"
        title="Incident Report"
        sx={{ width: '100%', height: '100vh', border: 'none' }}
        srcDoc={html}
      />
    </Box>
  );
};
