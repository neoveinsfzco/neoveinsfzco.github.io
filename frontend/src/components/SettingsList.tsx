// src/components/SettingsList.tsx
import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import api from '../api/client';

interface SettingsListProps {
  title: string;
  endpoint: string;
  businessUnitId: number | '';
  showCode?: boolean;
  showScore?: boolean;
}

interface SettingItem {
  id: number;
  name: string;
  code?: string;
  score?: number;
}

export function SettingsList({
  title,
  endpoint,
  businessUnitId,
  showCode = false,
  showScore = false,
}: SettingsListProps) {
  const [items, setItems] = useState<SettingItem[]>([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [score, setScore] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingCode, setEditingCode] = useState('');
  const [editingScore, setEditingScore] = useState<number | ''>('');

  const loadItems = async () => {
    if (!businessUnitId) {
      setItems([]);
      return;
    }
    try {
      const response = await api.get(endpoint, {
        params: { business_unit: businessUnitId, page_size: 1000 },
      });
      setItems(response.data.results || []);
    } catch (err) {
      console.error('Error loading settings', err);
      setItems([]);
    }
  };

  useEffect(() => {
    loadItems();
  }, [businessUnitId, endpoint]);

  const handleAdd = async () => {
    if (!businessUnitId) {
      setError('Select a Business Unit first.');
      return;
    }
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.post(endpoint, {
        business_unit: businessUnitId,
        name: name.trim(),
        ...(showCode && code.trim() ? { code: code.trim() } : {}),
        ...(showScore && score !== '' ? { score } : {}),
      });
      setName('');
      setCode('');
      setScore('');
      loadItems();
    } catch (err: any) {
      console.error('Error saving setting', err);
      setError('Failed to save setting.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this item? This item will be deleted.',
    );
    if (!confirmed) {
      return;
    }
    try {
      await api.delete(`${endpoint}${id}/`);
      loadItems();
    } catch (err) {
      console.error('Error deleting setting', err);
    }
  };

  const handleEditStart = (item: SettingItem) => {
    setEditingId(item.id);
    setEditingName(item.name);
    setEditingCode(item.code || '');
    setEditingScore(item.score ?? '');
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingName('');
    setEditingCode('');
    setEditingScore('');
  };

  const handleEditSave = async (id: number) => {
    setSubmitting(true);
    setError(null);
    try {
      await api.patch(`${endpoint}${id}/`, {
        name: editingName.trim(),
        ...(showCode ? { code: editingCode.trim() } : {}),
        ...(showScore ? { score: editingScore === '' ? null : editingScore } : {}),
      });
      handleEditCancel();
      loadItems();
    } catch (err) {
      console.error('Error updating setting', err);
      setError('Failed to update setting.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {title}
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          label="Name"
          size="small"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {showCode && (
          <TextField
            label="Code"
            size="small"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            sx={{ minWidth: 160 }}
          />
        )}
        {showScore && (
          <TextField
            label="Score"
            size="small"
            type="number"
            value={score}
            onChange={(e) => setScore(e.target.value ? Number(e.target.value) : '')}
            sx={{ minWidth: 120 }}
          />
        )}
        <Button
          variant="contained"
          onClick={handleAdd}
          disabled={submitting || !businessUnitId}
        >
          Add
        </Button>
      </Stack>

      {error && (
        <Typography variant="body2" color="error" sx={{ mb: 1 }}>
          {error}
        </Typography>
      )}

      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              {showCode && <TableCell>Code</TableCell>}
              {showScore && <TableCell>Score</TableCell>}
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {editingId === item.id ? (
                    <TextField
                      size="small"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                    />
                  ) : (
                    item.name
                  )}
                </TableCell>
                {showCode && (
                  <TableCell>
                    {editingId === item.id ? (
                      <TextField
                        size="small"
                        value={editingCode}
                        onChange={(e) => setEditingCode(e.target.value)}
                      />
                    ) : (
                      item.code || '-'
                    )}
                  </TableCell>
                )}
                {showScore && (
                  <TableCell>
                    {editingId === item.id ? (
                      <TextField
                        size="small"
                        type="number"
                        value={editingScore}
                        onChange={(e) =>
                          setEditingScore(
                            e.target.value ? Number(e.target.value) : ''
                          )
                        }
                        sx={{ maxWidth: 120 }}
                      />
                    ) : (
                      item.score ?? '-'
                    )}
                  </TableCell>
                )}
                <TableCell>
                  {editingId === item.id ? (
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleEditSave(item.id)}
                        disabled={submitting || !editingName.trim()}
                      >
                        Save
                      </Button>
                      <Button size="small" variant="text" onClick={handleEditCancel}>
                        Cancel
                      </Button>
                    </Stack>
                  ) : (
                    <Stack direction="row" spacing={1}>
                      <Button size="small" onClick={() => handleEditStart(item)}>
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </Button>
                    </Stack>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={showScore ? 4 : showCode ? 3 : 2}>
                  <Typography variant="body2" color="text.secondary">
                    No settings defined.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );
}
