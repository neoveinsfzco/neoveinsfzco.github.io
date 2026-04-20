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
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import api from '../api/client';
import { WorkflowStatusChips } from './WorkflowStatusChips';
import { getUsername } from '../auth/tokenStorage';

interface IncidentWorkflowDrawerProps {
  open: boolean;
  onClose: () => void;
  incidentId: number | null;
  onUpdated?: () => void;
}

interface IncidentDetail {
  id: number;
  reference: string;
  status: string;
  reported_by_username?: string;
  date_reported?: string;
  incident_date?: string;
  description?: string;
  incident_type_name?: string;
  department_name?: string;
  witness_name?: string;
  root_cause?: string;
  immediate_actions?: string;
  corrective_actions?: string;
  acknowledged_by_designation?: string;
  assigned_by_designation?: string;
  reviewed_by_designation?: string;
  approved_by_designation?: string;
  closed_by_designation?: string;
  immediate_actions_data?: Array<{
    no: number;
    action: string;
    responsible: string;
    date: string;
    status: string;
  }>;
}

const STATUS_STEPS = [
  'Submitted',
  'Acknowledged',
  'Assigned',
  'Investigation',
  'Reviewed',
  'Approved',
  'Closed',
];

interface IncidentTaskTemplate {
  id: number;
  name: string;
  task_type: string;
}

interface IncidentTask {
  id: number;
  incident: number;
  template?: number | null;
  description?: string;
  status: string;
  assigned_to_ids?: number[];
  response_text?: string;
  response_data?: Record<string, any>;
}

interface Investigation {
  id: number;
  incident: number;
  problem_definition?: string;
  team_composition?: string;
  current_process_map?: string;
  rca_tool?: number | null;
  rca_tool_details?: string;
  root_cause?: string;
  action_plan_items?: any[];
  risk_assessment_items?: any[];
  prepared_by_designation?: string;
  reviewed_by_designation?: string;
  approved_by_designation?: string;
}

interface SimpleOption {
  id: number;
  name: string;
  score?: number;
}

export const IncidentWorkflowDrawer: React.FC<IncidentWorkflowDrawerProps> = ({
  open,
  onClose,
  incidentId,
  onUpdated,
}) => {
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [status, setStatus] = useState('Submitted');
  const [rootCause, setRootCause] = useState('');
  const [immediateActions, setImmediateActions] = useState('');
  const [correctiveActions, setCorrectiveActions] = useState('');
  const [designation, setDesignation] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<IncidentTask[]>([]);
  const [taskTemplates, setTaskTemplates] = useState<IncidentTaskTemplate[]>([]);
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [rcaTools, setRcaTools] = useState<SimpleOption[]>([]);
  const [effectivenessRatings, setEffectivenessRatings] = useState<SimpleOption[]>([]);
  const [members, setMembers] = useState<Array<{ id: number; username: string; role: string }>>([]);

  const [assignTemplateId, setAssignTemplateId] = useState<number | ''>('');
  const [assignDescription, setAssignDescription] = useState('');
  const [assignToIds, setAssignToIds] = useState<number[]>([]);

  const [problemDefinition, setProblemDefinition] = useState('');
  const [teamComposition, setTeamComposition] = useState('');
  const [processMap, setProcessMap] = useState('');
  const [rcaToolId, setRcaToolId] = useState<number | ''>('');
  const [rcaToolDetails, setRcaToolDetails] = useState('');
  const [investigationRootCause, setInvestigationRootCause] = useState('');
  const [actionPlanRows, setActionPlanRows] = useState<any[]>([]);
  const [riskRows, setRiskRows] = useState<any[]>([]);
  const [preparedDesignation, setPreparedDesignation] = useState('');
  const [reviewedDesignation, setReviewedDesignation] = useState('');
  const [approvedDesignation, setApprovedDesignation] = useState('');
  const [taskResponses, setTaskResponses] = useState<Record<number, any>>({});

  const displayDateReported = useMemo(() => {
    if (!incident?.date_reported) {
      return '-';
    }
    return new Date(incident.date_reported).toLocaleString();
  }, [incident?.date_reported]);

  const displayIncidentDate = useMemo(() => {
    if (!incident?.incident_date) {
      return '-';
    }
    return new Date(incident.incident_date).toLocaleString();
  }, [incident?.incident_date]);

  const fetchIncident = async () => {
    if (!incidentId) {
      setIncident(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<IncidentDetail>(`ir/incidents/${incidentId}/`);
      setIncident(res.data);
      setStatus(res.data.status || 'Submitted');
      setRootCause(res.data.root_cause || '');
      setImmediateActions(res.data.immediate_actions || '');
      setCorrectiveActions(res.data.corrective_actions || '');
      const statusDesignationMap: Record<string, string | undefined> = {
        Acknowledged: res.data.acknowledged_by_designation,
        Assigned: res.data.assigned_by_designation,
        Reviewed: res.data.reviewed_by_designation,
        Approved: res.data.approved_by_designation,
        Closed: res.data.closed_by_designation,
      };
      setDesignation(statusDesignationMap[res.data.status] || '');
    } catch (err) {
      console.error('Error loading incident workflow', err);
      setError('Unable to load the incident details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && incidentId) {
      fetchIncident();
    }
  }, [open, incidentId]);

  const fetchWorkflowMeta = async () => {
    if (!incidentId) {
      return;
    }
    try {
      const [taskRes, templateRes, rcaRes, effRes, invRes] = await Promise.all([
        api.get('ir/tasks/', { params: { incident: incidentId, page_size: 200 } }),
        api.get('ir/task-templates/', { params: { page_size: 200 } }),
        api.get('ir/rca-tools/', { params: { page_size: 200 } }),
        api.get('ir/effectiveness-ratings/', { params: { page_size: 200 } }),
        api.get('ir/investigations/', { params: { incident: incidentId } }),
      ]);
      setTasks(taskRes.data.results || []);
      const responseMap: Record<number, any> = {};
      (taskRes.data.results || []).forEach((task: IncidentTask) => {
        responseMap[task.id] = task.response_data || {};
      });
      setTaskResponses(responseMap);
      setTaskTemplates(templateRes.data.results || []);
      setRcaTools(rcaRes.data.results || []);
      setEffectivenessRatings(effRes.data.results || []);
      const inv = invRes.data.results?.[0] || null;
      setInvestigation(inv);
      if (inv) {
        setProblemDefinition(inv.problem_definition || '');
        setTeamComposition(inv.team_composition || '');
        setProcessMap(inv.current_process_map || '');
        setRcaToolId(inv.rca_tool || '');
        setRcaToolDetails(inv.rca_tool_details || '');
        setInvestigationRootCause(inv.root_cause || '');
        setActionPlanRows(inv.action_plan_items || []);
        setRiskRows(inv.risk_assessment_items || []);
        setPreparedDesignation(inv.prepared_by_designation || '');
        setReviewedDesignation(inv.reviewed_by_designation || '');
        setApprovedDesignation(inv.approved_by_designation || '');
      }
    } catch (err) {
      console.error('Error loading workflow meta', err);
    }
  };

  const fetchMembers = async () => {
    if (!incidentId) {
      return;
    }
    try {
      const res = await api.get('bu-memberships/', { params: { incident: incidentId } });
      const items = res.data.results || [];
      setMembers(
        items.map((item: any) => ({
          id: item.user?.id,
          username: item.user?.username || 'User',
          role: item.role,
        })),
      );
    } catch (err) {
      console.error('Error loading members', err);
    }
  };

  useEffect(() => {
    if (open && incidentId) {
      fetchWorkflowMeta();
      fetchMembers();
    }
  }, [open, incidentId]);

  const handleSave = async () => {
    if (!incidentId) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const designationPayload: Record<string, string> = {};
      if (status === 'Acknowledged') {
        designationPayload.acknowledged_by_designation = designation.trim();
      }
      if (status === 'Assigned') {
        designationPayload.assigned_by_designation = designation.trim();
      }
      if (status === 'Reviewed') {
        designationPayload.reviewed_by_designation = designation.trim();
      }
      if (status === 'Approved') {
        designationPayload.approved_by_designation = designation.trim();
      }
      if (status === 'Closed') {
        designationPayload.closed_by_designation = designation.trim();
      }

      await api.patch(`ir/incidents/${incidentId}/`, {
        status,
        root_cause: rootCause,
        immediate_actions: immediateActions,
        corrective_actions: correctiveActions,
        ...designationPayload,
      });
      await fetchIncident();
      onUpdated?.();
    } catch (err: any) {
      console.error('Error updating incident workflow', err);
      if (err.response?.status === 403) {
        setError('You do not have permission to move this incident to that status.');
      } else {
        setError('Failed to update the incident workflow.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!incidentId) return;
    setStatus('Acknowledged');
    await handleSave();
  };

  const handleAssignTask = async () => {
    if (!incidentId || (!assignTemplateId && !assignDescription.trim()) || assignToIds.length === 0) {
      setError('Select assignees and a task.');
      return;
    }
    try {
      await api.post('ir/tasks/', {
        incident: incidentId,
        template: assignTemplateId || null,
        description: assignDescription.trim(),
        assigned_to_ids: assignToIds,
      });
      setAssignTemplateId('');
      setAssignDescription('');
      setAssignToIds([]);
      await fetchWorkflowMeta();
      setStatus('Assigned');
    } catch (err) {
      console.error('Error assigning task', err);
    }
  };

  const saveInvestigation = async () => {
    if (!incidentId) return;
    const payload = {
      incident: incidentId,
      problem_definition: problemDefinition,
      team_composition: teamComposition,
      current_process_map: processMap,
      rca_tool: rcaToolId || null,
      rca_tool_details: rcaToolDetails,
      root_cause: investigationRootCause,
      action_plan_items: actionPlanRows,
      risk_assessment_items: riskRows,
      prepared_by_designation: preparedDesignation,
      reviewed_by_designation: reviewedDesignation,
      approved_by_designation: approvedDesignation,
    };
    try {
      if (investigation?.id) {
        await api.patch(`ir/investigations/${investigation.id}/`, payload);
      } else {
        await api.post('ir/investigations/', payload);
      }
      await fetchWorkflowMeta();
      setStatus('Investigation');
    } catch (err) {
      console.error('Error saving investigation', err);
    }
  };

  const addActionPlanRow = () => {
    setActionPlanRows((prev) => [
      ...prev,
      {
        no: prev.length + 1,
        findings: '',
        root_causes: '',
        corrective_actions: '',
        responsible: '',
        support: '',
        target_date: '',
        status: '',
        action_taken: '',
        evaluation: '',
      },
    ]);
  };

  const addRiskRow = () => {
    setRiskRows((prev) => [
      ...prev,
      {
        no: prev.length + 1,
        activity: '',
        risk: '',
        affected: '',
        severity: '',
        probability: '',
        risk_rating: '',
        action_required: '',
        control_measures: '',
        status: '',
        evaluation: '',
      },
    ]);
  };

  const getTemplateType = (task: IncidentTask) =>
    taskTemplates.find((t) => t.id === task.template)?.task_type || 'GENERAL';

  const updateTaskResponse = (taskId: number, data: any) => {
    setTaskResponses((prev) => ({
      ...prev,
      [taskId]: {
        ...(prev[taskId] || {}),
        ...data,
      },
    }));
  };

  const submitTaskResponse = async (task: IncidentTask, responseData: any, responseText?: string) => {
    try {
      await api.patch(`ir/tasks/${task.id}/`, {
        status: 'Completed',
        response_data: responseData,
        ...(responseText ? { response_text: responseText } : {}),
      });
      await fetchWorkflowMeta();
    } catch (err) {
      console.error('Error submitting task response', err);
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
          <Typography variant="subtitle1">Incident Workflow</Typography>
          <Typography variant="body2" color="text.secondary">
            {incident?.reference || 'No incident selected'}
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
          <Paper variant="outlined" sx={{ p: 1.5 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Report Details
            </Typography>
            <Stack spacing={0.5}>
              <Typography variant="body2">
                Reference: {incident?.reference || '-'}
              </Typography>
              <Typography variant="body2">
                Reported by: {incident?.reported_by_username || '-'}
              </Typography>
              <Typography variant="body2">Reported at: {displayDateReported}</Typography>
              <Typography variant="body2">Incident date: {displayIncidentDate}</Typography>
              <Typography variant="body2">
                Department: {incident?.department_name || '-'}
              </Typography>
              <Typography variant="body2">
                Incident Type: {incident?.incident_type_name || '-'}
              </Typography>
              <Typography variant="body2">
                Witness: {incident?.witness_name || '-'}
              </Typography>
              <Typography variant="body2">
                Description: {incident?.description || '-'}
              </Typography>
            </Stack>
          </Paper>

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
              label="Designation (current step)"
              size="small"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
            />

            <TextField
              label="Root cause"
              multiline
              minRows={2}
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
            />
            <TextField
              label="Immediate actions"
              multiline
              minRows={2}
              value={immediateActions}
              onChange={(e) => setImmediateActions(e.target.value)}
            />
            <TextField
              label="Corrective actions"
              multiline
              minRows={2}
              value={correctiveActions}
              onChange={(e) => setCorrectiveActions(e.target.value)}
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

          <Divider />

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Acknowledgement
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2">
                Quality users acknowledge the report and lock acknowledgers.
              </Typography>
              <Button variant="contained" onClick={handleAcknowledge}>
                Acknowledge Report
              </Button>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Immediate Actions
            </Typography>
            {incident?.immediate_actions_data?.length ? (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>No</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Responsible</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {incident.immediate_actions_data.map((row, index) => (
                    <TableRow key={`${row.no}-${index}`}>
                      <TableCell>{row.no}</TableCell>
                      <TableCell>{row.action}</TableCell>
                      <TableCell>{row.responsible}</TableCell>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{row.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No immediate actions recorded.
              </Typography>
            )}
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Assignment
            </Typography>
            <Stack spacing={1.5}>
              <TextField
                select
                label="Task Template"
                size="small"
                value={assignTemplateId}
                onChange={(e) =>
                  setAssignTemplateId(e.target.value ? Number(e.target.value) : '')
                }
              >
                <MenuItem value="">
                  <em>Free text</em>
                </MenuItem>
                {taskTemplates.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name} ({t.task_type})
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Task Description"
                size="small"
                fullWidth
                value={assignDescription}
                onChange={(e) => setAssignDescription(e.target.value)}
              />
              <TextField
                select
                label="Assign To"
                size="small"
                SelectProps={{ multiple: true }}
                value={assignToIds}
                onChange={(e) => {
                  const value = e.target.value as string | number[];
                  setAssignToIds(
                    typeof value === 'string'
                      ? value.split(',').map((item) => Number(item))
                      : value.map((item) => Number(item)),
                  );
                }}
              >
                {members.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.username} ({m.role})
                  </MenuItem>
                ))}
              </TextField>
              <Button variant="contained" onClick={handleAssignTask}>
                Assign Task
              </Button>
            </Stack>
            <Stack spacing={1} sx={{ mt: 2 }}>
              {tasks.map((task) => {
                const taskType = getTemplateType(task);
                const response = taskResponses[task.id] || {};
                return (
                  <Paper key={task.id} variant="outlined" sx={{ p: 1.5 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip label={task.status} size="small" />
                      <Typography variant="body2">
                        {task.description ||
                          taskTemplates.find((t) => t.id === task.template)?.name ||
                          'Task'}
                      </Typography>
                    </Stack>

                    {taskType === 'GENERAL' && (
                      <Stack spacing={1} sx={{ mt: 1 }}>
                        <TextField
                          label="Response"
                          size="small"
                          fullWidth
                          defaultValue={task.response_text || ''}
                          onChange={(e) =>
                            updateTaskResponse(task.id, { response_text: e.target.value })
                          }
                        />
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() =>
                            submitTaskResponse(task, response, response.response_text)
                          }
                        >
                          Submit Response
                        </Button>
                      </Stack>
                    )}

                    {taskType === 'RCA' && (
                      <Stack spacing={1} sx={{ mt: 1 }}>
                        <TextField
                          label="Problem Definition"
                          size="small"
                          multiline
                          minRows={2}
                          value={response.problem_definition || ''}
                          onChange={(e) =>
                            updateTaskResponse(task.id, { problem_definition: e.target.value })
                          }
                        />
                        <TextField
                          label="Team Composition"
                          size="small"
                          multiline
                          minRows={2}
                          value={response.team_composition || ''}
                          onChange={(e) =>
                            updateTaskResponse(task.id, { team_composition: e.target.value })
                          }
                        />
                        <TextField
                          label="Current Process Map"
                          size="small"
                          multiline
                          minRows={2}
                          value={response.current_process_map || ''}
                          onChange={(e) =>
                            updateTaskResponse(task.id, { current_process_map: e.target.value })
                          }
                        />
                        <TextField
                          select
                          label="RCA Tool"
                          size="small"
                          value={response.rca_tool || ''}
                          onChange={(e) =>
                            updateTaskResponse(task.id, { rca_tool: e.target.value })
                          }
                        >
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          {rcaTools.map((tool) => (
                            <MenuItem key={tool.id} value={tool.id}>
                              {tool.name}
                            </MenuItem>
                          ))}
                        </TextField>
                        <TextField
                          label="RCA Tool Details"
                          size="small"
                          multiline
                          minRows={2}
                          value={response.rca_tool_details || ''}
                          onChange={(e) =>
                            updateTaskResponse(task.id, { rca_tool_details: e.target.value })
                          }
                        />
                        <TextField
                          label="Identified Root Cause"
                          size="small"
                          multiline
                          minRows={2}
                          value={response.root_cause || ''}
                          onChange={(e) =>
                            updateTaskResponse(task.id, { root_cause: e.target.value })
                          }
                        />
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => submitTaskResponse(task, taskResponses[task.id])}
                        >
                          Submit RCA
                        </Button>
                      </Stack>
                    )}

                    {taskType === 'ACTION_PLAN' && (
                      <Stack spacing={1} sx={{ mt: 1 }}>
                        {(response.action_plan_items || []).map((row: any, index: number) => (
                          <Stack key={index} direction={{ xs: 'column', md: 'row' }} spacing={1}>
                            <TextField
                              label="Findings"
                              size="small"
                              value={row.findings || ''}
                              onChange={(e) => {
                                const next = [...(response.action_plan_items || [])];
                                next[index].findings = e.target.value;
                                updateTaskResponse(task.id, { action_plan_items: next });
                              }}
                            />
                            <TextField
                              label="Root Causes"
                              size="small"
                              value={row.root_causes || ''}
                              onChange={(e) => {
                                const next = [...(response.action_plan_items || [])];
                                next[index].root_causes = e.target.value;
                                updateTaskResponse(task.id, { action_plan_items: next });
                              }}
                            />
                            <TextField
                              label="Corrective Actions"
                              size="small"
                              value={row.corrective_actions || ''}
                              onChange={(e) => {
                                const next = [...(response.action_plan_items || [])];
                                next[index].corrective_actions = e.target.value;
                                updateTaskResponse(task.id, { action_plan_items: next });
                              }}
                            />
                          </Stack>
                        ))}
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() =>
                            updateTaskResponse(task.id, {
                              action_plan_items: [
                                ...(response.action_plan_items || []),
                                {
                                  findings: '',
                                  root_causes: '',
                                  corrective_actions: '',
                                  responsible: '',
                                  support: '',
                                  target_date: '',
                                  status: '',
                                  action_taken: '',
                                  evaluation: '',
                                },
                              ],
                            })
                          }
                        >
                          Add Action Row
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => submitTaskResponse(task, taskResponses[task.id])}
                        >
                          Submit Action Plan
                        </Button>
                      </Stack>
                    )}

                    {taskType === 'RISK_ASSESSMENT' && (
                      <Stack spacing={1} sx={{ mt: 1 }}>
                        {(response.risk_items || []).map((row: any, index: number) => (
                          <Stack key={index} direction={{ xs: 'column', md: 'row' }} spacing={1}>
                            <TextField
                              label="Activity"
                              size="small"
                              value={row.activity || ''}
                              onChange={(e) => {
                                const next = [...(response.risk_items || [])];
                                next[index].activity = e.target.value;
                                updateTaskResponse(task.id, { risk_items: next });
                              }}
                            />
                            <TextField
                              label="Risk"
                              size="small"
                              value={row.risk || ''}
                              onChange={(e) => {
                                const next = [...(response.risk_items || [])];
                                next[index].risk = e.target.value;
                                updateTaskResponse(task.id, { risk_items: next });
                              }}
                            />
                            <TextField
                              label="Severity"
                              size="small"
                              value={row.severity || ''}
                              onChange={(e) => {
                                const next = [...(response.risk_items || [])];
                                next[index].severity = e.target.value;
                                const sev = Number(next[index].severity || 0);
                                const prob = Number(next[index].probability || 0);
                                next[index].risk_rating = sev && prob ? sev * prob : '';
                                updateTaskResponse(task.id, { risk_items: next });
                              }}
                            />
                            <TextField
                              label="Probability"
                              size="small"
                              value={row.probability || ''}
                              onChange={(e) => {
                                const next = [...(response.risk_items || [])];
                                next[index].probability = e.target.value;
                                const sev = Number(next[index].severity || 0);
                                const prob = Number(next[index].probability || 0);
                                next[index].risk_rating = sev && prob ? sev * prob : '';
                                updateTaskResponse(task.id, { risk_items: next });
                              }}
                            />
                            <TextField
                              label="Risk Rating"
                              size="small"
                              value={row.risk_rating || ''}
                              InputProps={{ readOnly: true }}
                            />
                          </Stack>
                        ))}
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() =>
                            updateTaskResponse(task.id, {
                              risk_items: [
                                ...(response.risk_items || []),
                                { activity: '', risk: '', severity: '', probability: '', risk_rating: '' },
                              ],
                            })
                          }
                        >
                          Add Risk Row
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => submitTaskResponse(task, taskResponses[task.id])}
                        >
                          Submit Risk Assessment
                        </Button>
                      </Stack>
                    )}
                  </Paper>
                );
              })}
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Investigation (RCA)
            </Typography>
            <Stack spacing={1.5}>
              <TextField
                label="Problem Definition"
                multiline
                minRows={2}
                value={problemDefinition}
                onChange={(e) => setProblemDefinition(e.target.value)}
              />
              <TextField
                label="Team Composition / Individuals Consulted"
                multiline
                minRows={2}
                value={teamComposition}
                onChange={(e) => setTeamComposition(e.target.value)}
              />
              <TextField
                label="Current Process Map"
                multiline
                minRows={2}
                value={processMap}
                onChange={(e) => setProcessMap(e.target.value)}
              />
              <TextField
                select
                label="RCA Tool"
                value={rcaToolId}
                onChange={(e) => setRcaToolId(e.target.value ? Number(e.target.value) : '')}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {rcaTools.map((tool) => (
                  <MenuItem key={tool.id} value={tool.id}>
                    {tool.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="RCA Tool Details"
                multiline
                minRows={2}
                value={rcaToolDetails}
                onChange={(e) => setRcaToolDetails(e.target.value)}
              />
              <TextField
                label="Identified Root Cause"
                multiline
                minRows={2}
                value={investigationRootCause}
                onChange={(e) => setInvestigationRootCause(e.target.value)}
              />
              <Button variant="contained" onClick={saveInvestigation}>
                Save Investigation
              </Button>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Action Plan
            </Typography>
            <Stack spacing={1}>
              {actionPlanRows.map((row, index) => (
                <Stack key={index} direction={{ xs: 'column', md: 'row' }} spacing={1}>
                  <TextField
                    label="Findings"
                    size="small"
                    value={row.findings}
                    onChange={(e) => {
                      const next = [...actionPlanRows];
                      next[index].findings = e.target.value;
                      setActionPlanRows(next);
                    }}
                  />
                  <TextField
                    label="Root Causes"
                    size="small"
                    value={row.root_causes}
                    onChange={(e) => {
                      const next = [...actionPlanRows];
                      next[index].root_causes = e.target.value;
                      setActionPlanRows(next);
                    }}
                  />
                  <TextField
                    label="Corrective Actions"
                    size="small"
                    value={row.corrective_actions}
                    onChange={(e) => {
                      const next = [...actionPlanRows];
                      next[index].corrective_actions = e.target.value;
                      setActionPlanRows(next);
                    }}
                  />
                </Stack>
              ))}
              <Button variant="outlined" onClick={addActionPlanRow}>
                Add Action Plan Row
              </Button>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Risk Assessment
            </Typography>
            <Stack spacing={1}>
              {riskRows.map((row, index) => (
                <Stack key={index} direction={{ xs: 'column', md: 'row' }} spacing={1}>
                  <TextField
                    label="Activity/Action"
                    size="small"
                    value={row.activity}
                    onChange={(e) => {
                      const next = [...riskRows];
                      next[index].activity = e.target.value;
                      setRiskRows(next);
                    }}
                  />
                  <TextField
                    label="Risk"
                    size="small"
                    value={row.risk}
                    onChange={(e) => {
                      const next = [...riskRows];
                      next[index].risk = e.target.value;
                      setRiskRows(next);
                    }}
                  />
                  <TextField
                    label="Severity (1-5)"
                    size="small"
                    value={row.severity}
                    onChange={(e) => {
                      const next = [...riskRows];
                      next[index].severity = e.target.value;
                      const sev = Number(next[index].severity || 0);
                      const prob = Number(next[index].probability || 0);
                      next[index].risk_rating = sev && prob ? sev * prob : '';
                      setRiskRows(next);
                    }}
                  />
                  <TextField
                    label="Probability (1-5)"
                    size="small"
                    value={row.probability}
                    onChange={(e) => {
                      const next = [...riskRows];
                      next[index].probability = e.target.value;
                      const sev = Number(next[index].severity || 0);
                      const prob = Number(next[index].probability || 0);
                      next[index].risk_rating = sev && prob ? sev * prob : '';
                      setRiskRows(next);
                    }}
                  />
                  <TextField
                    label="Risk Rating"
                    size="small"
                    value={row.risk_rating}
                    InputProps={{ readOnly: true }}
                  />
                  <TextField
                    select
                    label="Evaluation"
                    size="small"
                    value={row.evaluation}
                    onChange={(e) => {
                      const next = [...riskRows];
                      next[index].evaluation = e.target.value;
                      setRiskRows(next);
                    }}
                  >
                    {effectivenessRatings.map((rating) => (
                      <MenuItem key={rating.id} value={rating.name}>
                        {rating.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>
              ))}
              <Button variant="outlined" onClick={addRiskRow}>
                Add Risk Row
              </Button>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Signatures
            </Typography>
            <Stack spacing={1}>
              <TextField
                label="Prepared By Designation"
                size="small"
                value={preparedDesignation}
                onChange={(e) => setPreparedDesignation(e.target.value)}
              />
              <TextField
                label="Reviewed By Designation"
                size="small"
                value={reviewedDesignation}
                onChange={(e) => setReviewedDesignation(e.target.value)}
              />
              <TextField
                label="Approved By Designation"
                size="small"
                value={approvedDesignation}
                onChange={(e) => setApprovedDesignation(e.target.value)}
              />
              <Typography variant="caption" color="text.secondary">
                Current user: {getUsername() || '-'}
              </Typography>
              <Button variant="contained" onClick={saveInvestigation}>
                Save Signatures
              </Button>
            </Stack>
          </Paper>
        </>
      )}
    </Drawer>
  );
};
