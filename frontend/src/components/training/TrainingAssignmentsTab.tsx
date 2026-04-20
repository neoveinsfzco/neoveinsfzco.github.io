import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import api from '../../api/client';
import {
  createTrainingAssignment,
  createTrainingAssignmentItem,
  fetchTrainingAssignments,
  fetchTrainingCourses,
  fetchTrainingLearningPaths,
  generateTrainingEnrollments,
  fetchTrainingProfiles,
} from '../../api/training';

interface TrainingAssignmentsTabProps {
  businessUnitId: number | '';
}

export const TrainingAssignmentsTab: React.FC<TrainingAssignmentsTabProps> = ({ businessUnitId }) => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [learningPaths, setLearningPaths] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    assignment_type: 'RECOMMENDED',
    start_date: '',
    due_date: '',
    assigned_by_department: '',
    learner_note: '',
    allow_retake: false,
    exempt_if_completed: true,
  });
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
  const [selectedPathIds, setSelectedPathIds] = useState<number[]>([]);
  const [targetDepartmentIds, setTargetDepartmentIds] = useState<number[]>([]);
  const [targetUserIds, setTargetUserIds] = useState<number[]>([]);
  const [targetType, setTargetType] = useState<'department' | 'user'>('department');
  const [assignmentError, setAssignmentError] = useState('');

  const normalizeMultiSelect = (value: unknown): number[] => {
    if (Array.isArray(value)) {
      return value.map((item) => Number(item)).filter((item) => !Number.isNaN(item));
    }
    if (typeof value === 'string' && value.length > 0) {
      return value
        .split(',')
        .map((item) => Number(item))
        .filter((item) => !Number.isNaN(item));
    }
    return [];
  };

  const columns: GridColDef[] = useMemo(
    () => [
      { field: 'title', headerName: 'Assignment', minWidth: 200, flex: 1.5 },
      { field: 'assignment_type', headerName: 'Type', minWidth: 120, flex: 0.6 },
      {
        field: 'start_date',
        headerName: 'Start',
        minWidth: 140,
        flex: 0.8,
        valueFormatter: (value) => (value ? new Date(String(value)).toLocaleDateString() : '-'),
      },
      {
        field: 'due_date',
        headerName: 'Due',
        minWidth: 140,
        flex: 0.8,
        valueFormatter: (value) => (value ? new Date(String(value)).toLocaleDateString() : '-'),
      },
    ],
    [],
  );

  useEffect(() => {
    if (!businessUnitId) {
      setAssignments([]);
      setCourses([]);
      setDepartments([]);
      setProfiles([]);
      return;
    }
    fetchTrainingAssignments(businessUnitId).then((res) => setAssignments(res.data.results || []));
    fetchTrainingCourses(businessUnitId).then((res) => setCourses(res.data.results || []));
    fetchTrainingLearningPaths(businessUnitId).then((res) => setLearningPaths(res.data.results || []));
    api.get('departments/', { params: { business_unit: businessUnitId } }).then((res) => setDepartments(res.data.results || []));
    fetchTrainingProfiles(businessUnitId).then((res) => setProfiles(res.data.results || []));
  }, [businessUnitId]);

  const handleCreateAssignment = async () => {
    if (!businessUnitId) return;
    if (!form.title || !form.start_date) {
      setAssignmentError('Assignment title and start date are required.');
      return;
    }
    if ((selectedCourseIds.length > 0 && selectedPathIds.length > 0) || (selectedCourseIds.length === 0 && selectedPathIds.length === 0)) {
      setAssignmentError('Select either course(s) or learning path(s), not both.');
      return;
    }
    const hasDept = targetDepartmentIds.length > 0;
    const hasUsers = targetUserIds.length > 0;
    if (!hasDept && !hasUsers) {
      setAssignmentError('Select at least one department or user.');
      return;
    }
    if (hasDept && hasUsers) {
      setAssignmentError('Target must be either department OR user.');
      return;
    }
    setAssignmentError('');
    const payload = {
      ...form,
      business_unit: businessUnitId,
      assigned_by_department: form.assigned_by_department || null,
      target_departments: targetDepartmentIds,
      target_users: targetUserIds,
    };
    const assignmentRes = await createTrainingAssignment(payload);
    const assignment = assignmentRes.data;
    for (const courseId of selectedCourseIds) {
      await createTrainingAssignmentItem({ assignment: assignment.id, course: courseId });
    }
    for (const pathId of selectedPathIds) {
      await createTrainingAssignmentItem({ assignment: assignment.id, learning_path: pathId });
    }
    await generateTrainingEnrollments(assignment.id, {
      department_ids: targetDepartmentIds,
      user_ids: targetUserIds,
    });
    const refreshed = await fetchTrainingAssignments(businessUnitId);
    setAssignments(refreshed.data.results || []);
  };

  if (!businessUnitId) {
    return (
      <Typography variant="body2" color="text.secondary">
        Select a Business Unit to manage assignments.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Assignments
        </Typography>
        <DataGrid
          autoHeight
          rows={assignments}
          columns={columns}
          pageSizeOptions={[25, 50, 100]}
          sx={{ minHeight: 260 }}
        />
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Create Assignment
        </Typography>
        <Stack spacing={1.5}>
          <TextField
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <TextField
            label="Description"
            multiline
            minRows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              select
              label="Type"
              value={form.assignment_type}
              onChange={(e) => setForm({ ...form, assignment_type: e.target.value })}
            >
              <MenuItem value="RECOMMENDED">Recommended</MenuItem>
              <MenuItem value="MANDATORY">Mandatory</MenuItem>
              <MenuItem value="VOLUNTARY">Voluntary</MenuItem>
            </TextField>
            <TextField
              label="Start Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
            <TextField
              label="Due Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
          </Stack>
          <TextField
            select
            label="Assigned By Department"
            value={form.assigned_by_department}
            onChange={(e) => setForm({ ...form, assigned_by_department: e.target.value })}
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
            label="Learner Note"
            multiline
            minRows={2}
            value={form.learner_note}
            onChange={(e) => setForm({ ...form, learner_note: e.target.value })}
          />
          <TextField
            select
            label="Courses"
            value={selectedCourseIds}
            SelectProps={{ multiple: true }}
            onChange={(e) => setSelectedCourseIds(normalizeMultiSelect(e.target.value))}
            disabled={selectedPathIds.length > 0}
          >
            {courses.map((course) => (
              <MenuItem key={course.id} value={course.id}>
                {course.title}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Learning Paths"
            value={selectedPathIds}
            SelectProps={{ multiple: true }}
            onChange={(e) => setSelectedPathIds(normalizeMultiSelect(e.target.value))}
            disabled={selectedCourseIds.length > 0}
          >
            {learningPaths.map((path) => (
              <MenuItem key={path.id} value={path.id}>
                {path.title}
              </MenuItem>
            ))}
          </TextField>
          <Divider />
          <Typography variant="subtitle2">Target Learners</Typography>
          <TextField
            select
            label="Target Type"
            value={targetType}
            onChange={(e) => {
              const value = e.target.value as 'department' | 'user';
              setTargetType(value);
              setTargetDepartmentIds([]);
              setTargetUserIds([]);
            }}
          >
            <MenuItem value="department">Departments</MenuItem>
            <MenuItem value="user">Users</MenuItem>
          </TextField>
          <TextField
            select
            label="Departments"
            value={targetDepartmentIds}
            SelectProps={{ multiple: true }}
            onChange={(e) => setTargetDepartmentIds(normalizeMultiSelect(e.target.value))}
            disabled={targetType !== 'department'}
          >
            {departments.map((dept) => (
              <MenuItem key={dept.id} value={dept.id}>
                {dept.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Users"
            value={targetUserIds}
            SelectProps={{ multiple: true }}
            onChange={(e) => setTargetUserIds(normalizeMultiSelect(e.target.value))}
            disabled={targetType !== 'user'}
          >
            {profiles.map((profile) => (
              <MenuItem key={profile.user} value={profile.user}>
                {profile.user_username}
              </MenuItem>
            ))}
          </TextField>
          <Box>
            <Button variant="contained" onClick={handleCreateAssignment}>
              Create Assignment & Enroll
            </Button>
          </Box>
          {assignmentError && (
            <Typography variant="body2" color="error">
              {assignmentError}
            </Typography>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
};
