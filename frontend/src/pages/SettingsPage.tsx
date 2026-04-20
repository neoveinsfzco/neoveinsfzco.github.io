// src/pages/SettingsPage.tsx
import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import api from '../api/client';
import { SettingsList } from '../components/SettingsList';

interface SettingsPageProps {
  selectedBuId: number | '';
}

interface DocumentCategory {
  id: number;
  name: string;
}

interface DocumentType {
  id: number;
  name: string;
  code?: string;
  category: number | null;
}

interface TaskTemplate {
  id: number;
  name: string;
  task_type: string;
}

export function SettingsPage({ selectedBuId }: SettingsPageProps) {
  const [tab, setTab] = useState(0);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [types, setTypes] = useState<DocumentType[]>([]);
  const [typeName, setTypeName] = useState('');
  const [typeCode, setTypeCode] = useState('');
  const [typeCategoryId, setTypeCategoryId] = useState<number | ''>('');
  const [editingTypeId, setEditingTypeId] = useState<number | null>(null);
  const [editingTypeName, setEditingTypeName] = useState('');
  const [editingTypeCode, setEditingTypeCode] = useState('');
  const [editingTypeCategoryId, setEditingTypeCategoryId] = useState<number | ''>('');
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [taskTemplateName, setTaskTemplateName] = useState('');
  const [taskTemplateType, setTaskTemplateType] = useState('GENERAL');

  const loadDms = async () => {
    if (!selectedBuId) {
      setCategories([]);
      setTypes([]);
      return;
    }
    try {
      const [catRes, typeRes] = await Promise.all([
        api.get('dms/categories/', {
          params: { business_unit: selectedBuId, page_size: 1000 },
        }),
        api.get('dms/types/', {
          params: { business_unit: selectedBuId, page_size: 1000 },
        }),
      ]);
      setCategories(catRes.data.results || []);
      setTypes(typeRes.data.results || []);
    } catch (err) {
      console.error('Error loading DMS settings', err);
    }
  };

  useEffect(() => {
    loadDms();
  }, [selectedBuId]);

  useEffect(() => {
    if (!selectedBuId) {
      setTaskTemplates([]);
      return;
    }
    api
      .get('ir/task-templates/', {
        params: { business_unit: selectedBuId, page_size: 1000 },
      })
      .then((res) => setTaskTemplates(res.data.results || []))
      .catch((err) => console.error('Error loading task templates', err));
  }, [selectedBuId]);

  const handleAddType = async () => {
    if (!selectedBuId || !typeName.trim()) {
      return;
    }
    try {
      await api.post('dms/types/', {
        business_unit: selectedBuId,
        name: typeName.trim(),
        ...(typeCode.trim() ? { code: typeCode.trim() } : {}),
        ...(typeCategoryId ? { category: typeCategoryId } : {}),
      });
      setTypeName('');
      setTypeCode('');
      setTypeCategoryId('');
      loadDms();
    } catch (err) {
      console.error('Error creating type', err);
    }
  };

  const handleDeleteType = async (id: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this item? This item will be deleted.',
    );
    if (!confirmed) {
      return;
    }
    try {
      await api.delete(`dms/types/${id}/`);
      loadDms();
    } catch (err) {
      console.error('Error deleting type', err);
    }
  };

  const handleAddTaskTemplate = async () => {
    if (!selectedBuId || !taskTemplateName.trim()) {
      return;
    }
    try {
      await api.post('ir/task-templates/', {
        business_unit: selectedBuId,
        name: taskTemplateName.trim(),
        task_type: taskTemplateType,
      });
      setTaskTemplateName('');
      setTaskTemplateType('GENERAL');
      const res = await api.get('ir/task-templates/', {
        params: { business_unit: selectedBuId, page_size: 1000 },
      });
      setTaskTemplates(res.data.results || []);
    } catch (err) {
      console.error('Error adding task template', err);
    }
  };

  const handleDeleteTaskTemplate = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this item? This item will be deleted.')) {
      return;
    }
    try {
      await api.delete(`ir/task-templates/${id}/`);
      setTaskTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Error deleting task template', err);
    }
  };

  const handleEditTypeStart = (type: DocumentType) => {
    setEditingTypeId(type.id);
    setEditingTypeName(type.name);
    setEditingTypeCode(type.code || '');
    setEditingTypeCategoryId(type.category ?? '');
  };

  const handleEditTypeCancel = () => {
    setEditingTypeId(null);
    setEditingTypeName('');
    setEditingTypeCode('');
    setEditingTypeCategoryId('');
  };

  const handleEditTypeSave = async (id: number) => {
    try {
      await api.patch(`dms/types/${id}/`, {
        name: editingTypeName.trim(),
        ...(editingTypeCode.trim() ? { code: editingTypeCode.trim() } : {}),
        ...(editingTypeCategoryId ? { category: editingTypeCategoryId } : { category: null }),
      });
      handleEditTypeCancel();
      loadDms();
    } catch (err) {
      console.error('Error updating type', err);
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Module Settings</Typography>
        <Typography variant="body2" color="text.secondary">
          Manage per‑Business Unit configuration for each module.
        </Typography>
      </Paper>

      {!selectedBuId && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Select a Business Unit to manage its settings.
          </Typography>
        </Paper>
      )}

      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
        <Tab label="Common" />
        <Tab label="DMS" />
        <Tab label="IR" />
        <Tab label="NC" />
        <Tab label="Training" />
      </Tabs>

      {tab === 0 && (
        <Box>
          <SettingsList
            title="Departments"
            endpoint="departments/"
            businessUnitId={selectedBuId}
            showCode
          />
        </Box>
      )}

      {tab === 1 && (
        <Box>
          <SettingsList
            title="Document Categories"
            endpoint="dms/categories/"
            businessUnitId={selectedBuId}
            showCode
          />

          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Document Types
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
              <TextField
                label="Name"
                size="small"
                fullWidth
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
              />
              <TextField
                label="Code"
                size="small"
                value={typeCode}
                onChange={(e) => setTypeCode(e.target.value)}
                sx={{ minWidth: 160 }}
              />
              <TextField
                select
                label="Category"
                size="small"
                value={typeCategoryId}
                onChange={(e) =>
                  setTypeCategoryId(e.target.value ? Number(e.target.value) : '')
                }
                sx={{ minWidth: 200 }}
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
              <Button
                variant="contained"
                onClick={handleAddType}
                disabled={!selectedBuId}
              >
                Add
              </Button>
            </Stack>

            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {types.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell>
                        {editingTypeId === type.id ? (
                          <TextField
                            size="small"
                            value={editingTypeName}
                            onChange={(e) => setEditingTypeName(e.target.value)}
                          />
                        ) : (
                          type.name
                        )}
                      </TableCell>
                      <TableCell>
                        {editingTypeId === type.id ? (
                          <TextField
                            size="small"
                            value={editingTypeCode}
                            onChange={(e) => setEditingTypeCode(e.target.value)}
                          />
                        ) : (
                          type.code || '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {editingTypeId === type.id ? (
                          <TextField
                            select
                            size="small"
                            value={editingTypeCategoryId}
                            onChange={(e) =>
                              setEditingTypeCategoryId(
                                e.target.value ? Number(e.target.value) : ''
                              )
                            }
                            sx={{ minWidth: 160 }}
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
                        ) : (
                          categories.find((cat) => cat.id === type.category)?.name || '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {editingTypeId === type.id ? (
                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleEditTypeSave(type.id)}
                              disabled={!editingTypeName.trim()}
                            >
                              Save
                            </Button>
                            <Button size="small" variant="text" onClick={handleEditTypeCancel}>
                              Cancel
                            </Button>
                          </Stack>
                        ) : (
                          <Stack direction="row" spacing={1}>
                            <Button size="small" onClick={() => handleEditTypeStart(type)}>
                              Edit
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              onClick={() => handleDeleteType(type.id)}
                            >
                              Delete
                            </Button>
                          </Stack>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {types.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Typography variant="body2" color="text.secondary">
                          No document types defined.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Box>
      )}

      {tab === 2 && (
        <Box>
          <SettingsList
            title="Incident Types"
            endpoint="ir/incident-types/"
            businessUnitId={selectedBuId}
            showCode
          />
          <SettingsList
            title="Incident Locations"
            endpoint="ir/incident-locations/"
            businessUnitId={selectedBuId}
            showCode
          />
          <SettingsList
            title="Incident Severity"
            endpoint="ir/incident-severities/"
            businessUnitId={selectedBuId}
            showScore
          />
          <SettingsList
            title="Incident Probability"
            endpoint="ir/incident-probabilities/"
            businessUnitId={selectedBuId}
            showScore
          />
          <SettingsList
            title="Incident Risk Rating"
            endpoint="ir/incident-risk-ratings/"
            businessUnitId={selectedBuId}
            showScore
          />
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Task Templates
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
              <TextField
                label="Name"
                size="small"
                fullWidth
                value={taskTemplateName}
                onChange={(e) => setTaskTemplateName(e.target.value)}
              />
              <TextField
                select
                label="Type"
                size="small"
                value={taskTemplateType}
                onChange={(e) => setTaskTemplateType(e.target.value)}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="GENERAL">General</MenuItem>
                <MenuItem value="RCA">Root Cause Analysis</MenuItem>
                <MenuItem value="RISK_ASSESSMENT">Risk Assessment</MenuItem>
                <MenuItem value="ACTION_PLAN">Action Plan</MenuItem>
              </TextField>
              <Button variant="contained" onClick={handleAddTaskTemplate} disabled={!selectedBuId}>
                Add
              </Button>
            </Stack>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {taskTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>{template.name}</TableCell>
                      <TableCell>{template.task_type}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleDeleteTaskTemplate(template.id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {taskTemplates.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Typography variant="body2" color="text.secondary">
                          No task templates defined.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          </Paper>
          <SettingsList
            title="RCA Tools"
            endpoint="ir/rca-tools/"
            businessUnitId={selectedBuId}
          />
          <SettingsList
            title="Effectiveness Ratings"
            endpoint="ir/effectiveness-ratings/"
            businessUnitId={selectedBuId}
            showScore
          />
        </Box>
      )}

      {tab === 3 && (
        <Box>
          <SettingsList
            title="Occurrence Places"
            endpoint="nc/occurrences/"
            businessUnitId={selectedBuId}
            showCode
          />
          <SettingsList
            title="Sources"
            endpoint="nc/sources/"
            businessUnitId={selectedBuId}
            showCode
          />
          <SettingsList
            title="Non-Conformance Types"
            endpoint="nc/types/"
            businessUnitId={selectedBuId}
            showCode
          />
          <SettingsList
            title="Severity"
            endpoint="nc/severities/"
            businessUnitId={selectedBuId}
            showScore
          />
          <SettingsList
            title="Probability"
            endpoint="nc/probabilities/"
            businessUnitId={selectedBuId}
            showScore
          />
          <SettingsList
            title="Risk Rating"
            endpoint="nc/risk-ratings/"
            businessUnitId={selectedBuId}
            showScore
          />
        </Box>
      )}

      {tab === 4 && (
        <Box>
          <SettingsList
            title="Training Categories"
            endpoint="training/categories/"
            businessUnitId={selectedBuId}
          />
          <SettingsList
            title="Training Vendors"
            endpoint="training/vendors/"
            businessUnitId={selectedBuId}
          />
        </Box>
      )}
    </Box>
  );
}
