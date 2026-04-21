import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Chip, Paper } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import api from '../../api/client';
import { createHashRouteUrl } from '../../utils/routes';

interface TrainingCatalogTabProps {
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
  delivery_type?: string;
}

export const TrainingCatalogTab: React.FC<TrainingCatalogTabProps> = ({ businessUnitId }) => {
  const [rows, setRows] = useState<TrainingCourse[]>([]);
  const [loading, setLoading] = useState(false);

  const columns: GridColDef[] = useMemo(
    () => [
      { field: 'course_number', headerName: 'Course #', minWidth: 140, flex: 0.6 },
      { field: 'title', headerName: 'Title', minWidth: 220, flex: 1.2 },
      { field: 'category_name', headerName: 'Category', minWidth: 160, flex: 0.7 },
      { field: 'publish_start_date', headerName: 'Start', minWidth: 140, flex: 0.5 },
      { field: 'publish_end_date', headerName: 'End', minWidth: 140, flex: 0.5 },
      { field: 'delivery_type', headerName: 'Delivery', minWidth: 120, flex: 0.5 },
      {
        field: 'status',
        headerName: 'Status',
        minWidth: 120,
        renderCell: (params) => <Chip label={params.value} size="small" />,
      },
      {
        field: 'actions',
        headerName: 'Actions',
        minWidth: 140,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Button
            size="small"
            variant="outlined"
            onClick={() =>
              window.open(
                createHashRouteUrl(`/training/course/${params.row.id}`),
                '_blank',
                'noopener,noreferrer',
              )
            }
          >
            Open
          </Button>
        ),
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
      .get('training/courses/catalog', { params: { business_unit: businessUnitId } })
      .then((res) => setRows(res.data.results || res.data))
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
