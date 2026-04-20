import { useEffect, useMemo, useState } from 'react';
import { Box, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import {
  createTrainingLearningPath,
  createTrainingLearningPathCourse,
  deleteTrainingLearningPath,
  fetchTrainingCourses,
  fetchTrainingLearningPathCourses,
  fetchTrainingLearningPaths,
  updateTrainingLearningPath,
} from '../../api/training';

interface TrainingLearningPathTabProps {
  businessUnitId: number | '';
}

export const TrainingLearningPathTab: React.FC<TrainingLearningPathTabProps> = ({ businessUnitId }) => {
  const [paths, setPaths] = useState<any[]>([]);
  const [pathCourses, setPathCourses] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedPathId, setSelectedPathId] = useState<number | null>(null);
  const [pathForm, setPathForm] = useState({ title: '', description: '', duration_days: 30 });
  const [selectedCourseId, setSelectedCourseId] = useState<number | ''>('');
  const [sequenceOrder, setSequenceOrder] = useState(1);

  const pathColumns: GridColDef[] = useMemo(
    () => [
      { field: 'title', headerName: 'Learning Path', minWidth: 200, flex: 1.5 },
      { field: 'description', headerName: 'Description', minWidth: 240, flex: 2 },
      { field: 'duration_days', headerName: 'Duration (days)', minWidth: 140, flex: 0.8 },
    ],
    [],
  );

  const courseColumns: GridColDef[] = useMemo(
    () => [
      { field: 'course_title', headerName: 'Course', minWidth: 220, flex: 1.5 },
      { field: 'sequence_order', headerName: 'Order', minWidth: 100, flex: 0.5 },
    ],
    [],
  );

  useEffect(() => {
    if (!businessUnitId) {
      setPaths([]);
      setCourses([]);
      return;
    }
    fetchTrainingLearningPaths(businessUnitId).then((res) => setPaths(res.data.results || []));
    fetchTrainingCourses(businessUnitId).then((res) => setCourses(res.data.results || []));
  }, [businessUnitId]);

  useEffect(() => {
    if (!selectedPathId) {
      setPathCourses([]);
      return;
    }
    fetchTrainingLearningPathCourses(selectedPathId).then((res) => setPathCourses(res.data.results || []));
  }, [selectedPathId]);

  if (!businessUnitId) {
    return (
      <Typography variant="body2" color="text.secondary">
        Select a Business Unit to manage learning paths.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Learning Paths
        </Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Box flex={1}>
            <DataGrid
              autoHeight
              rows={paths}
              columns={pathColumns}
              onRowClick={(params) => {
                const row = params.row;
                setSelectedPathId(row.id);
                setPathForm({
                  title: row.title || '',
                  description: row.description || '',
                  duration_days: row.duration_days || 30,
                });
              }}
              pageSizeOptions={[25, 50, 100]}
              sx={{ minHeight: 260 }}
            />
          </Box>
          <Box flex={1}>
            <Stack spacing={1.5}>
              <TextField
                label="Title"
                value={pathForm.title}
                onChange={(e) => setPathForm({ ...pathForm, title: e.target.value })}
              />
              <TextField
                label="Description"
                multiline
                minRows={2}
                value={pathForm.description}
                onChange={(e) => setPathForm({ ...pathForm, description: e.target.value })}
              />
              <TextField
                label="Duration (days)"
                type="number"
                value={pathForm.duration_days}
                onChange={(e) =>
                  setPathForm({ ...pathForm, duration_days: Number(e.target.value || 0) })
                }
              />
              <Button
                variant="contained"
                onClick={() =>
                  (selectedPathId
                    ? updateTrainingLearningPath(selectedPathId, pathForm)
                    : createTrainingLearningPath({ ...pathForm, business_unit: businessUnitId })
                  ).then(() =>
                    fetchTrainingLearningPaths(businessUnitId).then((res) => setPaths(res.data.results || [])),
                  )
                }
              >
                {selectedPathId ? 'Update Learning Path' : 'Save Learning Path'}
              </Button>
              {selectedPathId && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() =>
                    deleteTrainingLearningPath(selectedPathId).then(() => {
                      setSelectedPathId(null);
                      setPathForm({ title: '', description: '', duration_days: 30 });
                      fetchTrainingLearningPaths(businessUnitId).then((res) =>
                        setPaths(res.data.results || []),
                      );
                    })
                  }
                >
                  Delete Learning Path
                </Button>
              )}
            </Stack>
          </Box>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Add Courses to Path
        </Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Box flex={1}>
            <DataGrid
              autoHeight
              rows={pathCourses}
              columns={courseColumns}
              pageSizeOptions={[25, 50, 100]}
              sx={{ minHeight: 220 }}
            />
          </Box>
          <Box flex={1}>
            <Stack spacing={1.5}>
              <TextField
                select
                label="Course"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(Number(e.target.value))}
              >
                {courses.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.title}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Sequence Order"
                type="number"
                value={sequenceOrder}
                onChange={(e) => setSequenceOrder(Number(e.target.value))}
              />
              <Button
                variant="contained"
                disabled={!selectedPathId || !selectedCourseId}
                onClick={() => {
                  if (!selectedPathId || !selectedCourseId) return;
                  createTrainingLearningPathCourse({
                    learning_path: selectedPathId,
                    course: selectedCourseId,
                    sequence_order: sequenceOrder,
                  }).then(() => fetchTrainingLearningPathCourses(selectedPathId).then((res) => setPathCourses(res.data.results || [])));
                }}
              >
                Add to Path
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
};
