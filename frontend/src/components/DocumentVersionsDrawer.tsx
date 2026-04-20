// src/components/DocumentVersionsDrawer.tsx
import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import api from '../api/client';
import { WorkflowStatusChips } from './WorkflowStatusChips';

interface DocumentVersionsDrawerProps {
  open: boolean;
  onClose: () => void;
  documentId: number | null;
  documentTitle: string;
  onEditDocument?: () => void;
}

interface DocumentVersion {
  id: number;
  version_number: string;
  status: string;
  change_summary: string;
  created_at: string;
  created_by_username?: string | null;
  file_url: string;
  full_code?: string;
}

interface VersionListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DocumentVersion[];
}

export const DocumentVersionsDrawer: React.FC<DocumentVersionsDrawerProps> = ({
  open,
  onClose,
  documentId,
  documentTitle,
  onEditDocument,
}) => {
  const theme = useTheme();
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusById, setStatusById] = useState<Record<number, string>>({});
  const [versionById, setVersionById] = useState<Record<number, string>>({});

  const statusOptions = [
    'Draft',
    'Prepared',
    'Reviewed',
    'Approved',
    'Archived',
  ];

  // form state
  const [versionNumber, setVersionNumber] = useState('');
  const [status, setStatus] = useState<
    'Draft' | 'Prepared' | 'Reviewed' | 'Approved' | 'Archived'
  >('Draft');
  const [changeSummary, setChangeSummary] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const canSubmit = !!documentId && !!versionNumber && !!file;

  const resetForm = () => {
    setVersionNumber('');
    setStatus('Draft');
    setChangeSummary('');
    setFile(null);
    setError(null);
  };

  const fetchVersions = async () => {
    if (!documentId) {
      setVersions([]);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get<VersionListResponse>('dms/versions/', {
        params: { document: documentId },
      });
      const nextVersions = res.data.results || [];
      setVersions(nextVersions);
      const nextStatusById: Record<number, string> = {};
      const nextVersionById: Record<number, string> = {};
      nextVersions.forEach((v) => {
        nextStatusById[v.id] = v.status;
        nextVersionById[v.id] = v.version_number;
      });
      setStatusById(nextStatusById);
      setVersionById(nextVersionById);
    } catch (err) {
      console.error('Error loading document versions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && documentId) {
      fetchVersions();
    }
  }, [open, documentId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!documentId) {
      setError('No document selected.');
      return;
    }

    if (!file) {
      setError('Please choose a file.');
      return;
    }

    if (!versionNumber) {
      setError('Please enter a version number.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('document', String(documentId));
      formData.append('version_number', versionNumber);
      formData.append('status', status);
      formData.append('change_summary', changeSummary);
      formData.append('file', file);

      await api.post('dms/versions/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      resetForm();
      await fetchVersions();
    } catch (err: any) {
      console.error('Error creating version', err);
      if (err.response?.status === 401) {
        setError('You must be logged in to upload a version.');
      } else {
        setError('Failed to create version. Check console for details.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (versionId: number) => {
    const nextStatus = statusById[versionId];
    const nextVersionNumber = versionById[versionId];
    if (!nextStatus) {
      return;
    }
    setUpdatingId(versionId);
    try {
      await api.patch(`dms/versions/${versionId}/`, {
        status: nextStatus,
        version_number: nextVersionNumber,
      });
      await fetchVersions();
    } catch (err) {
      console.error('Error updating document status', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleViewVersion = async (versionId: number) => {
    try {
      const stamped = await api.get(`dms/versions/${versionId}/view/`, {
        responseType: 'blob',
      });
      const blobUrl = URL.createObjectURL(stamped.data);
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch (err) {
      console.error('Error viewing document version', err);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 420, md: 480 },
          p: 2,
          pt: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          backgroundColor:
            theme.palette.mode === 'light'
              ? 'rgba(255, 255, 255, 0.86)'
              : 'rgba(15, 23, 42, 0.82)',
          backdropFilter: 'blur(16px)',
          borderLeft: '1px solid rgba(148, 163, 184, 0.25)',
          boxShadow: '-10px 0 30px rgba(15, 23, 42, 0.12)',
        },
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="subtitle1">Document Versions</Typography>
          <Typography variant="body2" color="text.secondary">
            {documentTitle || 'No document selected'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          {onEditDocument && (
            <Button
              size="small"
              variant="outlined"
              onClick={onEditDocument}
              disabled={!documentId}
            >
              Edit Document
            </Button>
          )}
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </Box>

      <Divider />

      {/* Version upload form */}
      <Box component="form" onSubmit={handleSubmit}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          New Version
        </Typography>

        <Stack spacing={1.5}>
          <TextField
            label="Version number"
            size="small"
            required
            value={versionNumber}
            onChange={(e) => setVersionNumber(e.target.value)}
          />

          <TextField
            select
            label="Status"
            size="small"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <MenuItem value="Draft">Draft</MenuItem>
            <MenuItem value="Prepared">Prepared</MenuItem>
            <MenuItem value="Reviewed">Reviewed</MenuItem>
            <MenuItem value="Approved">Approved</MenuItem>
            <MenuItem value="Archived">Archived</MenuItem>
          </TextField>

          <TextField
            label="Change summary"
            size="small"
            multiline
            minRows={2}
            value={changeSummary}
            onChange={(e) => setChangeSummary(e.target.value)}
          />

          <Button variant="outlined" component="label" size="small">
            {file ? `File: ${file.name}` : 'Choose file'}
            <input type="file" hidden onChange={handleFileChange} />
          </Button>

          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}

          <Button
            type="submit"
            variant="contained"
            disabled={!canSubmit || submitting}
          >
            {submitting ? 'Uploading...' : 'Upload Version'}
          </Button>
        </Stack>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Versions list */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Existing Versions
        </Typography>

        {loading && (
          <Typography variant="body2" color="text.secondary">
            Loading versions...
          </Typography>
        )}

        {!loading && versions.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No versions found for this document.
          </Typography>
        )}

        <Stack spacing={1.5}>
          {versions.map((v) => (
            <Box
              key={v.id}
              sx={{
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                p: 1.5,
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 0.5 }}
              >
                <Typography variant="body2">
                  v{v.version_number}{' '}
                  {v.created_at && (
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                    >
                      - {new Date(v.created_at).toLocaleString()}
                    </Typography>
                  )}
                </Typography>
                <Chip
                  label={v.status}
                  size="small"
                  color={
                    v.status === 'Approved'
                      ? 'success'
                      : v.status === 'Reviewed'
                      ? 'info'
                      : v.status === 'Prepared'
                      ? 'warning'
                      : v.status === 'Archived'
                      ? 'default'
                      : 'default'
                  }
                  variant="outlined"
                />
              </Stack>

              {v.full_code && (
                <Typography variant="caption" color="text.secondary">
                  {v.full_code}
                </Typography>
              )}

              {v.created_by_username && (
                <Typography variant="caption" color="text.secondary">
                  By {v.created_by_username}
                </Typography>
              )}

              {v.change_summary && (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {v.change_summary}
                </Typography>
              )}

              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Workflow
                </Typography>
                <WorkflowStatusChips
                  steps={statusOptions}
                  current={statusById[v.id] || v.status}
                />
              </Box>

              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <TextField
                  size="small"
                  label="Version"
                  value={versionById[v.id] || v.version_number}
                  onChange={(e) =>
                    setVersionById((prev) => ({
                      ...prev,
                      [v.id]: e.target.value,
                    }))
                  }
                  sx={{ minWidth: 110 }}
                />
                <TextField
                  select
                  size="small"
                  label="Status"
                  value={statusById[v.id] || v.status}
                  onChange={(e) =>
                    setStatusById((prev) => ({
                      ...prev,
                      [v.id]: e.target.value,
                    }))
                  }
                  sx={{ minWidth: 160 }}
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleStatusUpdate(v.id)}
                  disabled={updatingId === v.id}
                >
                  {updatingId === v.id ? 'Updating...' : 'Update'}
                </Button>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => handleViewVersion(v.id)}
                >
                  View
                </Button>
              </Stack>

              {v.file_url && (
                <Button
                  href={v.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  variant="text"
                  sx={{ mt: 0.5, p: 0 }}
                >
                  Download
                </Button>
              )}
            </Box>
          ))}
        </Stack>
      </Box>
    </Drawer>
  );
};
