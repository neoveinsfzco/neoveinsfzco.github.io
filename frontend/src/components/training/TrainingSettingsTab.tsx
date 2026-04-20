import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import api from '../../api/client';
import { SettingsList } from '../SettingsList';

interface TrainingSettingsTabProps {
  businessUnitId: number | '';
}

interface TrainingCourse {
  id: number;
  title: string;
  course_number: string;
  status: string;
  publish_start_date: string;
  publish_end_date?: string | null;
  category_name?: string;
}

interface TrainingAssignment {
  id: number;
  title: string;
  assignment_type: string;
  start_date: string;
  due_date?: string | null;
}

interface TrainingProfile {
  id: number;
  user: number;
  user_username?: string;
  line_manager?: number | null;
  line_manager_username?: string;
  department?: number | null;
  department_name?: string;
  position?: string;
}

export const TrainingSettingsTab: React.FC<TrainingSettingsTabProps> = ({ businessUnitId }) => {
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [assignments, setAssignments] = useState<TrainingAssignment[]>([]);
  const [departments, setDepartments] = useState<Array<{ id: number; name: string }>>([]);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [vendors, setVendors] = useState<Array<{ id: number; name: string }>>([]);
  const [profiles, setProfiles] = useState<TrainingProfile[]>([]);
  const [members, setMembers] = useState<Array<{ id: number; username: string; role: string }>>([]);

  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    objectives: '',
    publish_start_date: '',
    publish_end_date: '',
    category: '',
    delivery_type: 'INHOUSE',
    vendor: '',
    min_effort_hours: '',
    max_effort_hours: '',
    mandatory_enabled: false,
    mandatory_departments: [] as number[],
    validity_years: 1,
    accreditation_enabled: false,
    accreditation_number: '',
    accreditation_body: '',
    status: 'DRAFT',
  });

  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    assignment_type: 'RECOMMENDED',
    start_date: '',
    due_date: '',
    assigned_by_department: '',
    learner_note: '',
    allow_retake: false,
    exempt_if_completed: true,
    course_ids: [] as number[],
  });

  const [profileForm, setProfileForm] = useState({
    user: '',
    line_manager: '',
    department: '',
    position: '',
  });

  const courseColumns: GridColDef[] = useMemo(
    () => [
      { field: 'course_number', headerName: 'Course #', minWidth: 140, flex: 0.6 },
      { field: 'title', headerName: 'Title', minWidth: 220, flex: 1 },
      { field: 'category_name', headerName: 'Category', minWidth: 160, flex: 0.7 },
      { field: 'publish_start_date', headerName: 'Start', minWidth: 140, flex: 0.5 },
      { field: 'publish_end_date', headerName: 'End', minWidth: 140, flex: 0.5 },
      {
        field: 'status',
        headerName: 'Status',
        minWidth: 120,
        renderCell: (params) => <Chip label={params.value} size="small" />,
      },
    ],
    [],
  );

  const assignmentColumns: GridColDef[] = useMemo(
    () => [
      { field: 'title', headerName: 'Assignment', minWidth: 220, flex: 1 },
      { field: 'assignment_type', headerName: 'Type', minWidth: 140, flex: 0.6 },
      { field: 'start_date', headerName: 'Start', minWidth: 140, flex: 0.5 },
      { field: 'due_date', headerName: 'Due', minWidth: 140, flex: 0.5 },
    ],
    [],
  );

  const profileColumns: GridColDef[] = useMemo(
    () => [
      { field: 'user_username', headerName: 'Employee', minWidth: 200, flex: 1 },
      { field: 'line_manager_username', headerName: 'Line Manager', minWidth: 200, flex: 1 },
      { field: 'department_name', headerName: 'Department', minWidth: 160, flex: 0.7 },
      { field: 'position', headerName: 'Position', minWidth: 160, flex: 0.7 },
    ],
    [],
  );

  const loadMeta = () => {
    if (!businessUnitId) return;
    api.get('departments/', { params: { business_unit: businessUnitId } }).then((res) => {
      setDepartments(res.data.results || []);
    });
    api.get('training/categories/', { params: { business_unit: businessUnitId } }).then((res) => {
      setCategories(res.data.results || []);
    });
    api.get('training/vendors/', { params: { business_unit: businessUnitId } }).then((res) => {
      setVendors(res.data.results || []);
    });
    api.get('bu-memberships/', { params: { business_unit: businessUnitId, page_size: 500 } }).then((res) => {
      const items = res.data.results || [];
      setMembers(
        items.map((item: any) => ({
          id: item.user?.id,
          username: item.user?.username || 'User',
          role: item.role,
        })),
      );
    });
  };

  const loadCourses = () => {
    if (!businessUnitId) return;
    api
      .get('training/courses/', { params: { business_unit: businessUnitId } })
      .then((res) => setCourses(res.data.results || []));
  };

  const loadAssignments = () => {
    if (!businessUnitId) return;
    api
      .get('training/assignments/', { params: { business_unit: businessUnitId } })
      .then((res) => setAssignments(res.data.results || []));
  };

  const loadProfiles = () => {
    if (!businessUnitId) return;
    api
      .get('training/employee-profiles/', { params: { business_unit: businessUnitId } })
      .then((res) => setProfiles(res.data.results || []));
  };

  useEffect(() => {
    loadMeta();
    loadCourses();
    loadAssignments();
    loadProfiles();
  }, [businessUnitId]);

  const handleCreateCourse = async () => {
    if (!businessUnitId) return;
    await api.post('training/courses/', {
      ...courseForm,
      business_unit: businessUnitId,
      category: courseForm.category || null,
      vendor: courseForm.vendor || null,
      publish_end_date: courseForm.publish_end_date || null,
      mandatory_departments: courseForm.mandatory_departments,
    });
    setCourseDialogOpen(false);
    loadCourses();
  };

  const handleCreateAssignment = async () => {
    if (!businessUnitId) return;
    const res = await api.post('training/assignments/', {
      business_unit: businessUnitId,
      title: assignmentForm.title,
      description: assignmentForm.description,
      assignment_type: assignmentForm.assignment_type,
      start_date: assignmentForm.start_date,
      due_date: assignmentForm.due_date || null,
      assigned_by_department: assignmentForm.assigned_by_department || null,
      learner_note: assignmentForm.learner_note,
      allow_retake: assignmentForm.allow_retake,
      exempt_if_completed: assignmentForm.exempt_if_completed,
    });
    const assignmentId = res.data.id;
    if (assignmentForm.course_ids.length) {
      await Promise.all(
        assignmentForm.course_ids.map((courseId) =>
          api.post('training/assignment-items/', {
            assignment: assignmentId,
            course: courseId,
          }),
        ),
      );
    }
    setAssignmentDialogOpen(false);
    loadAssignments();
  };

  const handleCreateProfile = async () => {
    if (!businessUnitId || !profileForm.user) return;
    await api.post('training/employee-profiles/', {
      business_unit: businessUnitId,
      user: Number(profileForm.user),
      line_manager: profileForm.line_manager ? Number(profileForm.line_manager) : null,
      department: profileForm.department ? Number(profileForm.department) : null,
      position: profileForm.position,
    });
    setProfileDialogOpen(false);
    setProfileForm({ user: '', line_manager: '', department: '', position: '' });
    loadProfiles();
  };

  if (!businessUnitId) {
    return (
      <Typography variant="body2" color="text.secondary">
        Select a Business Unit to manage training settings.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      <SettingsList
        title="Training Categories"
        endpoint="training/categories/"
        businessUnitId={businessUnitId}
      />
      <SettingsList
        title="Training Vendors"
        endpoint="training/vendors/"
        businessUnitId={businessUnitId}
      />

      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="subtitle1">Courses</Typography>
          <Button variant="contained" onClick={() => setCourseDialogOpen(true)}>
            New Course
          </Button>
        </Stack>
        <DataGrid autoHeight rows={courses} columns={courseColumns} pageSizeOptions={[25, 50, 100]} />
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="subtitle1">Assignments</Typography>
          <Button variant="contained" onClick={() => setAssignmentDialogOpen(true)}>
            New Assignment
          </Button>
        </Stack>
        <DataGrid autoHeight rows={assignments} columns={assignmentColumns} pageSizeOptions={[25, 50, 100]} />
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="subtitle1">Employee Profiles</Typography>
          <Button variant="contained" onClick={() => setProfileDialogOpen(true)}>
            Add Profile
          </Button>
        </Stack>
        <DataGrid
          autoHeight
          rows={profiles}
          columns={profileColumns}
          pageSizeOptions={[25, 50, 100]}
        />
      </Paper>

      <Dialog open={courseDialogOpen} onClose={() => setCourseDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>New Course</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              value={courseForm.title}
              onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
            />
            <TextField
              label="Description"
              multiline
              minRows={2}
              value={courseForm.description}
              onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
            />
            <TextField
              label="Objectives"
              multiline
              minRows={2}
              value={courseForm.objectives}
              onChange={(e) => setCourseForm({ ...courseForm, objectives: e.target.value })}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                type="date"
                label="Publish Start"
                InputLabelProps={{ shrink: true }}
                value={courseForm.publish_start_date}
                onChange={(e) => setCourseForm({ ...courseForm, publish_start_date: e.target.value })}
              />
              <TextField
                type="date"
                label="Publish End"
                InputLabelProps={{ shrink: true }}
                value={courseForm.publish_end_date}
                onChange={(e) => setCourseForm({ ...courseForm, publish_end_date: e.target.value })}
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="Category"
                value={courseForm.category}
                onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
              >
                <MenuItem value="">None</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Delivery Type"
                value={courseForm.delivery_type}
                onChange={(e) => setCourseForm({ ...courseForm, delivery_type: e.target.value })}
              >
                <MenuItem value="INHOUSE">In-house</MenuItem>
                <MenuItem value="VENDOR">Vendor</MenuItem>
              </TextField>
              <TextField
                select
                label="Vendor"
                value={courseForm.vendor}
                onChange={(e) => setCourseForm({ ...courseForm, vendor: e.target.value })}
              >
                <MenuItem value="">None</MenuItem>
                {vendors.map((vendor) => (
                  <MenuItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Min Effort (hours)"
                value={courseForm.min_effort_hours}
                onChange={(e) => setCourseForm({ ...courseForm, min_effort_hours: e.target.value })}
              />
              <TextField
                label="Max Effort (hours)"
                value={courseForm.max_effort_hours}
                onChange={(e) => setCourseForm({ ...courseForm, max_effort_hours: e.target.value })}
              />
              <TextField
                label="Validity (years)"
                type="number"
                value={courseForm.validity_years}
                onChange={(e) =>
                  setCourseForm({ ...courseForm, validity_years: Number(e.target.value || 1) })
                }
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <FormControlLabel
                control={
                  <Switch
                    checked={courseForm.mandatory_enabled}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, mandatory_enabled: e.target.checked })
                    }
                  />
                }
                label="Mandatory"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={courseForm.accreditation_enabled}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, accreditation_enabled: e.target.checked })
                    }
                  />
                }
                label="Accredited"
              />
            </Stack>
            {courseForm.mandatory_enabled && (
              <TextField
                select
                label="Mandatory Departments"
                SelectProps={{ multiple: true }}
                value={courseForm.mandatory_departments}
                onChange={(e) =>
                  setCourseForm({
                    ...courseForm,
                    mandatory_departments: e.target.value as unknown as number[],
                  })
                }
              >
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
            {courseForm.accreditation_enabled && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Accreditation Number"
                  value={courseForm.accreditation_number}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, accreditation_number: e.target.value })
                  }
                />
                <TextField
                  label="Accreditation Body"
                  value={courseForm.accreditation_body}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, accreditation_body: e.target.value })
                  }
                />
              </Stack>
            )}
            <TextField
              select
              label="Status"
              value={courseForm.status}
              onChange={(e) => setCourseForm({ ...courseForm, status: e.target.value })}
            >
              <MenuItem value="DRAFT">Draft</MenuItem>
              <MenuItem value="PUBLISHED">Published</MenuItem>
              <MenuItem value="ARCHIVED">Archived</MenuItem>
            </TextField>
            <Divider />
            <Stack direction="row" spacing={2}>
              <Button variant="contained" onClick={handleCreateCourse}>
                Create Course
              </Button>
              <Button variant="text" onClick={() => setCourseDialogOpen(false)}>
                Cancel
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog open={assignmentDialogOpen} onClose={() => setAssignmentDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>New Assignment</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              value={assignmentForm.title}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
            />
            <TextField
              label="Description"
              multiline
              minRows={2}
              value={assignmentForm.description}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="Assignment Type"
                value={assignmentForm.assignment_type}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, assignment_type: e.target.value })}
              >
                <MenuItem value="RECOMMENDED">Recommended</MenuItem>
                <MenuItem value="MANDATORY">Mandatory</MenuItem>
                <MenuItem value="VOLUNTARY">Voluntary</MenuItem>
              </TextField>
              <TextField
                type="date"
                label="Start Date"
                InputLabelProps={{ shrink: true }}
                value={assignmentForm.start_date}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, start_date: e.target.value })}
              />
              <TextField
                type="date"
                label="Due Date"
                InputLabelProps={{ shrink: true }}
                value={assignmentForm.due_date}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, due_date: e.target.value })}
              />
            </Stack>
            <TextField
              select
              label="Assigned by Department"
              value={assignmentForm.assigned_by_department}
              onChange={(e) =>
                setAssignmentForm({ ...assignmentForm, assigned_by_department: e.target.value })
              }
            >
              <MenuItem value="">None</MenuItem>
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
              value={assignmentForm.learner_note}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, learner_note: e.target.value })}
            />
            <TextField
              select
              label="Courses"
              SelectProps={{ multiple: true }}
              value={assignmentForm.course_ids}
              onChange={(e) =>
                setAssignmentForm({ ...assignmentForm,course_ids: e.target.value as unknown as number[]})
              }
            >
              {courses.map((course) => (
                <MenuItem key={course.id} value={course.id}>
                  {course.title}
                </MenuItem>
              ))}
            </TextField>
            <Stack direction="row" spacing={2}>
              <Button variant="contained" onClick={handleCreateAssignment}>
                Create Assignment
              </Button>
              <Button variant="text" onClick={() => setAssignmentDialogOpen(false)}>
                Cancel
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog open={profileDialogOpen} onClose={() => setProfileDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Employee Profile</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Employee"
              value={profileForm.user}
              onChange={(e) => setProfileForm({ ...profileForm, user: e.target.value })}
            >
              {members.map((member) => (
                <MenuItem key={member.id} value={member.id}>
                  {member.username} ({member.role})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Line Manager"
              value={profileForm.line_manager}
              onChange={(e) => setProfileForm({ ...profileForm, line_manager: e.target.value })}
            >
              <MenuItem value="">None</MenuItem>
              {members
                .filter((m) => m.role === 'LINE_MANAGER')
                .map((member) => (
                  <MenuItem key={member.id} value={member.id}>
                    {member.username}
                  </MenuItem>
                ))}
            </TextField>
            <TextField
              select
              label="Department"
              value={profileForm.department}
              onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
            >
              <MenuItem value="">None</MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Position"
              value={profileForm.position}
              onChange={(e) => setProfileForm({ ...profileForm, position: e.target.value })}
            />
            <Stack direction="row" spacing={2}>
              <Button variant="contained" onClick={handleCreateProfile}>
                Save
              </Button>
              <Button variant="text" onClick={() => setProfileDialogOpen(false)}>
                Cancel
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </Stack>
  );
};
