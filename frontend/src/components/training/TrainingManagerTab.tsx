import { useEffect, useMemo, useState } from 'react';
import { Paper, Stack, Typography } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { fetchManagerEnrollments, fetchTrainingProfiles } from '../../api/training';

interface TrainingManagerTabProps {
  businessUnitId: number | '';
}

interface TrainingProfile {
  id: number;
  user_username: string;
  department_name?: string;
  position?: string;
}

export const TrainingManagerTab: React.FC<TrainingManagerTabProps> = ({ businessUnitId }) => {
  const [rows, setRows] = useState<TrainingProfile[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const columns: GridColDef[] = useMemo(
    () => [
      { field: 'user_username', headerName: 'Employee', minWidth: 180, flex: 1 },
      { field: 'department_name', headerName: 'Department', minWidth: 160, flex: 1 },
      { field: 'position', headerName: 'Position', minWidth: 160, flex: 1 },
    ],
    [],
  );

  const enrollmentColumns: GridColDef[] = useMemo(
    () => [
      { field: 'user', headerName: 'Employee ID', minWidth: 120, flex: 0.6 },
      { field: 'assignment_title', headerName: 'Assignment', minWidth: 200, flex: 1.2 },
      { field: 'course_title', headerName: 'Course', minWidth: 200, flex: 1.2 },
      { field: 'learning_path_title', headerName: 'Learning Path', minWidth: 180, flex: 1 },
      { field: 'status', headerName: 'Status', minWidth: 120, flex: 0.6 },
    ],
    [],
  );

  useEffect(() => {
    if (!businessUnitId) {
      setRows([]);
      setEnrollments([]);
      return;
    }
    setLoading(true);
    fetchTrainingProfiles(businessUnitId, { mine: 1 })
      .then((res) => setRows(res.data.results || []))
      .catch((err) => console.error('Failed to load team profiles', err))
      .finally(() => setLoading(false));
    fetchManagerEnrollments(businessUnitId)
      .then((res) => setEnrollments(res.data.results || []))
      .catch((err) => console.error('Failed to load team enrollments', err));
  }, [businessUnitId]);

  if (!businessUnitId) {
    return (
      <Typography variant="body2" color="text.secondary">
        Select a Business Unit to view your team status.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      <Paper sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="subtitle1">Line Manager Employee Status</Typography>
        </Stack>
        <DataGrid
          autoHeight
          rows={rows}
          columns={columns}
          loading={loading}
          pageSizeOptions={[25, 50, 100]}
          disableRowSelectionOnClick
          getRowHeight={() => 'auto'}
          sx={{
            minHeight: 260,
            '& .MuiDataGrid-cell': {
              whiteSpace: 'normal',
              alignItems: 'center',
            },
          }}
        />
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="subtitle1">Assignments Progress</Typography>
        </Stack>
        <DataGrid
          autoHeight
          rows={enrollments}
          columns={enrollmentColumns}
          pageSizeOptions={[25, 50, 100]}
          disableRowSelectionOnClick
          getRowHeight={() => 'auto'}
          sx={{
            minHeight: 260,
            '& .MuiDataGrid-cell': {
              whiteSpace: 'normal',
              alignItems: 'center',
            },
          }}
        />
      </Paper>
    </Stack>
  );
};
