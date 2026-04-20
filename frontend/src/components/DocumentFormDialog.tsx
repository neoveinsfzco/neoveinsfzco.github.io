// src/components/DocumentFormDialog.tsx
import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
  TextField,
  MenuItem,
  Stack,
} from '@mui/material';
import api from '../api/client';
import type { Document } from './DocumentTable';

interface DocumentFormDialogProps {
  open: boolean;
  onClose: () => void;
  businessUnitId: number | '';
  documentToEdit?: Document | null;
  onSaved?: () => void;
}

interface Option {
  id: number;
  name: string;
}

interface CategoryListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: {
    id: number;
    name: string;
  }[];
}

interface TypeListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: {
    id: number;
    name: string;
    category: number | null;
  }[];
}

export const DocumentFormDialog: React.FC<DocumentFormDialogProps> = ({
  open,
  onClose,
  businessUnitId,
  documentToEdit,
  onSaved,
}) => {
  const isEdit = !!documentToEdit;

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [typeId, setTypeId] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);
  const [effectiveDate, setEffectiveDate] = useState<string>('');
  const [categories, setCategories] = useState<Option[]>([]);
  const [types, setTypes] = useState<Array<Option & { category: number | null }>>(
    [],
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load categories & types for this BU
  useEffect(() => {
    if (!open || !businessUnitId) {
      return;
    }

    const fetchOptions = async () => {
      try {
        const [catRes, typeRes] = await Promise.all([
          api.get<CategoryListResponse>('dms/categories/', {
            params: { business_unit: businessUnitId, page_size: 1000 },
          }),
          api.get<TypeListResponse>('dms/types/', {
            params: { business_unit: businessUnitId, page_size: 1000 },
          }),
        ]);
        setCategories(catRes.data.results || []);
        setTypes(typeRes.data.results || []);
      } catch (err) {
        console.error('Error loading categories/types', err);
      }
    };

    fetchOptions();
  }, [open, businessUnitId]);

  // Initialize form for edit vs create
  useEffect(() => {
    if (open && documentToEdit) {
      setTitle(documentToEdit.title);
      setCategoryId(documentToEdit.category ?? '');
      setTypeId(documentToEdit.type ?? '');
      setIsActive(documentToEdit.is_active);
      setEffectiveDate(documentToEdit.effective_date || '');
      setError(null);
    } else if (open && !documentToEdit) {
      setTitle('');
      setCategoryId('');
      setTypeId('');
      setIsActive(true);
      setEffectiveDate('');
      setError(null);
    }
  }, [open, documentToEdit]);


  const filteredTypes = categoryId
    ? types.filter((type) => type.category === categoryId)
    : types;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!businessUnitId) {
      setError('Please select a Business Unit first.');
      return;
    }

    if (!title) {
      setError('Title is required.');
      return;
    }

    const payload: any = {
      business_unit: businessUnitId,
      title,
      category: categoryId || null,
      type: typeId || null,
      is_active: isActive,
      effective_date: effectiveDate || null,
    };

    setSubmitting(true);
    try {
      if (isEdit && documentToEdit) {
        await api.put(`dms/documents/${documentToEdit.id}/`, payload);
      } else {
        await api.post('dms/documents/', payload);
      }

      if (onSaved) {
        onSaved();
      }
      onClose();
    } catch (err: any) {
      console.error('Error saving document', err);
      if (err.response?.status === 401) {
        setError('You must be logged in to save documents.');
      } else if (err.response?.data) {
        setError(JSON.stringify(err.response.data));
      } else {
        setError('Failed to save document.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Document' : 'New Document'}</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {isEdit && (
                <TextField
                  label="Code"
                  fullWidth
                  size="small"
                  value={documentToEdit?.code ?? ''}
                  InputProps={{ readOnly: true }}
                />
              )}
              <TextField
                label="Title"
                fullWidth
                required
                size="small"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="Category"
                fullWidth
                size="small"
                value={categoryId}
                onChange={(e) => {
                  const next = e.target.value ? Number(e.target.value) : '';
                  setCategoryId(next);
                  setTypeId('');
                }}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Type"
                fullWidth
                size="small"
                value={typeId}
                onChange={(e) => setTypeId(e.target.value ? Number(e.target.value) : '')}
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

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <TextField
                label="Effective date"
                type="date"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                }
                label="Active"
              />
            </Stack>

            {error && (
              <Box sx={{ color: 'error.main', fontSize: 13 }}>{error}</Box>
            )}
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit as any}
          variant="contained"
          disabled={submitting}
        >
          {isEdit ? 'Save changes' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
