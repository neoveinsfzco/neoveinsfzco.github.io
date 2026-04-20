// src/pages/DocumentUploadPage.tsx
import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
  MenuItem,
  Snackbar,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

import api from '../api/client';
import {
  createDocumentWithVersion,
  type CreateDocumentWithVersionResponse,
} from '../api/dms';

interface DocumentUploadPageProps {
  selectedBuId: number | '';
  selectedBuName: string | null;
}

interface DocumentCategory {
  id: number;
  name: string;
}

interface DocumentType {
  id: number;
  name: string;
  category: number | null;
}

interface CategoryListResponse {
  results: DocumentCategory[];
}

interface TypeListResponse {
  results: DocumentType[];
}

export function DocumentUploadPage({
  selectedBuId,
  selectedBuName,
}: DocumentUploadPageProps) {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [typeId, setTypeId] = useState<number | ''>('');
  const [status, setStatus] = useState('Draft');
  const [changeSummary, setChangeSummary] = useState('');

  const [file, setFile] = useState<File | null>(null);

  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [types, setTypes] = useState<DocumentType[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  const hasBu = selectedBuId !== '';

  // Load categories & types for the selected BU
  useEffect(() => {
    if (!hasBu) {
      setCategories([]);
      setTypes([]);
      setCategoryId('');
      setTypeId('');
      return;
    }

    const fetchMeta = async () => {
      try {
        const [catRes, typeRes] = await Promise.all([
          api.get<CategoryListResponse>('dms/categories/', {
            params: { business_unit: selectedBuId, page_size: 1000 },
          }),
          api.get<TypeListResponse>('dms/types/', {
            params: { business_unit: selectedBuId, page_size: 1000 },
          }),
        ]);

        setCategories(catRes.data.results || []);
        setTypes(typeRes.data.results || []);
      } catch (err) {
        console.error('Error loading categories/types', err);
      }
    };

    fetchMeta();
  }, [selectedBuId, hasBu]);

  useEffect(() => {
    setTypeId('');
  }, [categoryId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setFile(selected);
    } else {
      setFile(null);
    }
  };

  const filteredTypes = categoryId
    ? types.filter((type) => type.category === categoryId)
    : types;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasBu) {
      setError('Please select a Business Unit first.');
      return;
    }

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    if (!file) {
      setError('Please select a PDF file to upload.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        businessUnitId: selectedBuId as number,
        title: title.trim(),
        categoryId: categoryId || undefined,
        typeId: typeId || undefined,
        status,
        changeSummary: changeSummary.trim(),
        file,
      };

      const result: CreateDocumentWithVersionResponse =
        await createDocumentWithVersion(payload);

      console.log('Created document via upload', result);
      setSuccessOpen(true);

      // Optionally clear form
      setTitle('');
      setCategoryId('');
      setTypeId('');
      setStatus('Draft');
      setChangeSummary('');
      setFile(null);

      // Navigate back to DMS after a short delay
      setTimeout(() => {
        navigate('/dms');
      }, 500);
    } catch (err: any) {
      console.error('Error creating document with upload', err);
      setError(
        err.response?.data?.detail ||
          'Failed to create document. Please check your data and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 900,
        mx: 'auto',
        py: 3,
      }}
    >
      <Paper
        sx={{
          p: 3,
          mb: 2,
        }}
      >
        <Typography variant="h6" gutterBottom>
          New Document (Upload PDF)
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {hasBu
            ? `Business Unit: ${selectedBuName ?? selectedBuId}`
            : 'Please select a Business Unit from the top bar first.'}
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="Title"
                fullWidth
                size="small"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                select
                label="Category"
                fullWidth
                size="small"
                value={categoryId}
                onChange={(e) =>
                  setCategoryId(
                    e.target.value === '' ? '' : Number(e.target.value),
                  )
                }
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Type"
                fullWidth
                size="small"
                value={typeId}
                onChange={(e) =>
                  setTypeId(
                    e.target.value === '' ? '' : Number(e.target.value),
                  )
                }
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {filteredTypes.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                select
                label="Status"
                fullWidth
                size="small"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <MenuItem value="Draft">Draft</MenuItem>
                <MenuItem value="Prepared">Prepared</MenuItem>
                <MenuItem value="Reviewed">Reviewed</MenuItem>
                <MenuItem value="Approved">Approved</MenuItem>
                <MenuItem value="Archived">Archived</MenuItem>
              </TextField>

              <TextField
                label="Change Summary (optional)"
                fullWidth
                size="small"
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
              />
            </Stack>

            <Box>
              <Button variant="outlined" component="label">
                {file ? 'Change File' : 'Select PDF File'}
                <input
                  type="file"
                  accept="application/pdf"
                  hidden
                  onChange={handleFileChange}
                />
              </Button>
              {file && (
                <Typography
                  variant="body2"
                  sx={{ mt: 1 }}
                >{`Selected: ${file.name}`}</Typography>
              )}
            </Box>

            {error && (
              <Alert
                severity="error"
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}

            <Stack
              direction="row"
              spacing={1}
              justifyContent="flex-end"
              sx={{ mt: 1 }}
            >
              <Button
                variant="text"
                onClick={() => navigate('/dms')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={!hasBu || submitting}
              >
                {submitting ? 'Creating...' : 'Create Document'}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>

      <Snackbar
        open={successOpen}
        autoHideDuration={2500}
        onClose={() => setSuccessOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setSuccessOpen(false)}
          sx={{ width: '100%' }}
        >
          Document created successfully.
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default DocumentUploadPage;
