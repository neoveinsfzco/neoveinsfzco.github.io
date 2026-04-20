import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Chip, Paper } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import api from '../../api/client';
import { fetchTrainingLearningPathCourses } from '../../api/training';

interface TrainingAssignedTabProps {
  businessUnitId: number | '';
}

interface TrainingEnrollment {
  id: number;
  assignment_title?: string;
  course_title?: string;
  course_id?: number | null;
  learning_path_title?: string;
  learning_path_id?: number | null;
  assignment_type?: string;
  status: string;
  result?: {
    learning_path_due_date?: string | null;
  };
  progress?: {
    completedCourses?: number[];
  };
}

interface AssignedRow {
  id: string;
  enrollment_id: number;
  assignment_title?: string;
  course_title?: string;
  course_id?: number | null;
  learning_path_title?: string;
  learning_path_id?: number | null;
  assignment_type?: string;
  status: string;
  learning_path_due?: string | null;
  is_locked?: boolean;
  sequence_order?: number | null;
}

export const TrainingAssignedTab: React.FC<TrainingAssignedTabProps> = ({ businessUnitId }) => {
  const [rows, setRows] = useState<AssignedRow[]>([]);
  const [loading, setLoading] = useState(false);

  const columns: GridColDef[] = useMemo(
    () => [
      { field: 'assignment_title', headerName: 'Assignment', minWidth: 220, flex: 1 },
      { field: 'course_title', headerName: 'Course', minWidth: 220, flex: 1 },
      { field: 'learning_path_title', headerName: 'Learning Path', minWidth: 220, flex: 1 },
      { field: 'assignment_type', headerName: 'Type', minWidth: 140, flex: 0.6 },
      {
        field: 'learning_path_due',
        headerName: 'Path Due',
        minWidth: 140,
        valueFormatter: (value) => (value ? new Date(String(value)).toLocaleDateString() : '-'),
      },
      {
        field: 'status',
        headerName: 'Status',
        minWidth: 120,
        renderCell: (params) => {
          const color =
            params.value === 'COMPLETED'
              ? 'success'
              : params.value === 'IN_PROGRESS'
                ? 'primary'
                : params.value === 'LOCKED'
                  ? 'default'
                  : 'warning';
          return <Chip label={params.value} size="small" color={color as any} />;
        },
      },
      {
        field: 'actions',
        headerName: 'Actions',
        minWidth: 140,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const courseId = params.row.course_id;
          const enrollmentId = params.row.enrollment_id;
          return (
            <Button
              size="small"
              variant="outlined"
              disabled={!courseId || params.row.is_locked}
              onClick={() =>
                window.open(`/training/course/${courseId}?enrollment=${enrollmentId}`, '_blank')
              }
            >
              {params.row.is_locked ? 'Locked' : 'Open'}
            </Button>
          );
        },
      },
    ],
    [],
  );

  useEffect(() => {
    if (!businessUnitId) {
      setRows([]);
      return;
    }
    setLoading(true);
    api
      .get('training/enrollments/', {
        params: { mine: 1, assignment_item__assignment__business_unit: businessUnitId },
      })
      .then(async (res) => {
        const enrollments: TrainingEnrollment[] = res.data.results || [];
        const expandedRows = await Promise.all(
          enrollments.map(async (enrollment) => {
            if (!enrollment.learning_path_id) {
              return [
                {
                  id: `enrollment-${enrollment.id}`,
                  enrollment_id: enrollment.id,
                  assignment_title: enrollment.assignment_title,
                  course_title: enrollment.course_title,
                  course_id: enrollment.course_id,
                  learning_path_title: enrollment.learning_path_title,
                  learning_path_id: enrollment.learning_path_id,
                  assignment_type: enrollment.assignment_type,
                  status: enrollment.status,
                  learning_path_due: enrollment.result?.learning_path_due_date || null,
                  is_locked: false,
                  sequence_order: null,
                } satisfies AssignedRow,
              ];
            }

            const completedCourses = new Set(enrollment.progress?.completedCourses || []);
            const pathCoursesRes = await fetchTrainingLearningPathCourses(enrollment.learning_path_id);
            const pathCourses = (pathCoursesRes.data.results || []).sort(
              (a: any, b: any) => (a.sequence_order || 0) - (b.sequence_order || 0),
            );
            const nextCourseId =
              pathCourses.find((course: any) => !completedCourses.has(course.course))?.course ?? null;

            return pathCourses.map(
              (pathCourse: any) =>
                ({
                  id: `enrollment-${enrollment.id}-course-${pathCourse.course}`,
                  enrollment_id: enrollment.id,
                  assignment_title: enrollment.assignment_title,
                  course_title: pathCourse.course_title,
                  course_id: pathCourse.course,
                  learning_path_title: enrollment.learning_path_title,
                  learning_path_id: enrollment.learning_path_id,
                  assignment_type: enrollment.assignment_type,
                  learning_path_due: enrollment.result?.learning_path_due_date || null,
                  is_locked:
                    !completedCourses.has(pathCourse.course) &&
                    nextCourseId !== null &&
                    pathCourse.course !== nextCourseId,
                  status: completedCourses.has(pathCourse.course)
                    ? 'COMPLETED'
                    : pathCourse.course === nextCourseId
                      ? 'IN_PROGRESS'
                      : 'LOCKED',
                  sequence_order: pathCourse.sequence_order ?? null,
                }) satisfies AssignedRow,
            );
          }),
        );

        setRows(expandedRows.flat());
      })
      .finally(() => setLoading(false));
  }, [businessUnitId]);

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ minHeight: 420 }}>
        <DataGrid
          autoHeight
          rows={rows}
          columns={columns}
          loading={loading}
          pageSizeOptions={[25, 50, 100]}
        />
      </Box>
    </Paper>
  );
};
