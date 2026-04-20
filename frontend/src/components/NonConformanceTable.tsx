// src/components/NonConformanceTable.tsx
import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type {
  GridColDef,
  GridPaginationModel,
  GridSortModel,
} from '@mui/x-data-grid/models';
import api from '../api/client';

interface NonConformance {
  id: number;
  reference: string;
  description?: string;
  date_raised?: string;
  status: string;
  classification?: string;
  raised_by_username?: string;
  occurrence_place_name?: string;
  source_name?: string;
  nc_type_name?: string;
  severity_option_name?: string;
  probability_option_name?: string;
  risk_rating_option_name?: string;
}

interface NonConformanceListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: NonConformance[];
}

interface NonConformanceTableProps {
  businessUnitId: number | '';
  reloadToken?: number;
  onOpenWorkflow?: (nonConformanceId: number) => void;
}

export function NonConformanceTable({
  businessUnitId,
  reloadToken,
  onOpenWorkflow,
}: NonConformanceTableProps) {
  const [rows, setRows] = useState<NonConformance[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: 'risk_profile', sort: 'desc' },
  ]);
  const [search, setSearch] = useState('');
  const currentYear = new Date().getFullYear();
  const [yearFilter, setYearFilter] = useState<number | 'all'>(currentYear);
  const [riskRatingOptions, setRiskRatingOptions] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [riskRatingFilter, setRiskRatingFilter] = useState<number | 'all'>('all');
  const yearOptions = useMemo(() => {
    const years: Array<number | 'all'> = ['all'];
    for (let y = currentYear; y >= currentYear - 5; y -= 1) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  const riskColor = (value: string) => {
    switch ((value || '').toLowerCase()) {
      case 'critical':
      case 'severe':
        return 'error';
      case 'major':
      case 'high':
        return 'warning';
      case 'moderate':
      case 'medium':
        return 'info';
      case 'minor':
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'Raised':
        return 'warning';
      case 'Logged':
        return 'warning';
      case 'Assigned':
        return 'info';
      case 'RCA':
        return 'info';
      case 'CAPA Implemented':
        return 'info';
      case 'Verified':
        return 'success';
      case 'Closed':
        return 'success';
      default:
        return 'default';
    }
  };

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: 'reference',
        headerName: 'Reference',
        flex: 0.8,
        minWidth: 140,
        sortable: false,
      },
      {
        field: 'description',
        headerName: 'Description',
        flex: 1.6,
        minWidth: 240,
        sortable: false,
      },
      {
        field: 'nc_type_name',
        headerName: 'NC Type',
        flex: 1,
        minWidth: 160,
        sortable: false,
        valueGetter: (value) => value || '-',
      },
      {
        field: 'occurrence_place_name',
        headerName: 'Occurrence',
        flex: 1,
        minWidth: 160,
        sortable: false,
        valueGetter: (value) => value || '-',
      },
      {
        field: 'source_name',
        headerName: 'Source',
        flex: 1,
        minWidth: 160,
        sortable: false,
        valueGetter: (value) => value || '-',
      },
      {
        field: 'date_raised',
        headerName: 'Date Raised',
        flex: 1,
        minWidth: 160,
        sortable: false,
        valueFormatter: (value) =>
          value ? new Date(String(value)).toLocaleDateString() : '-',
      },
      {
        field: 'status',
        headerName: 'Status',
        flex: 0.8,
        minWidth: 130,
        sortable: false,
        renderCell: (params) => (
          <Chip
            label={params.value}
            size="small"
            color={statusColor(String(params.value)) as any}
            variant="outlined"
          />
        ),
      },
      {
        field: 'classification',
        headerName: 'Classification',
        flex: 1,
        minWidth: 160,
        sortable: false,
      },
      {
        field: 'risk_profile',
        headerName: 'Risk Profile',
        flex: 1.4,
        minWidth: 260,
        sortable: true,
        valueGetter: (_value, row) => {
          const severity = row?.severity_option_name || '-';
          const probability = row?.probability_option_name || '-';
          const risk = row?.risk_rating_option_name || '-';
          return `Severity: ${severity} | Probability: ${probability} | Risk: ${risk}`;
        },
        renderCell: (params) => (
          <Stack spacing={0.5} sx={{ py: 0.5 }}>
            <Chip
              label={`Severity: ${params?.row?.severity_option_name || '-'}`}
              size="small"
              variant="outlined"
              color={riskColor(String(params?.row?.severity_option_name || '')) as any}
              sx={{ justifyContent: 'flex-start' }}
            />
            <Chip
              label={`Probability: ${params?.row?.probability_option_name || '-'}`}
              size="small"
              variant="outlined"
              color={riskColor(String(params?.row?.probability_option_name || '')) as any}
              sx={{ justifyContent: 'flex-start' }}
            />
            <Chip
              label={`Risk: ${params?.row?.risk_rating_option_name || '-'}`}
              size="small"
              variant="filled"
              color={riskColor(String(params?.row?.risk_rating_option_name || '')) as any}
              sx={{ justifyContent: 'flex-start', fontWeight: 700 }}
            />
          </Stack>
        ),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        flex: 0.6,
        minWidth: 130,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Button
            size="small"
            variant="outlined"
            onClick={() => onOpenWorkflow?.(params.row.id)}
          >
            Workflow
          </Button>
        ),
      },
    ],
    [onOpenWorkflow],
  );

  useEffect(() => {
    if (!businessUnitId) {
      setRows([]);
      setRowCount(0);
      return;
    }

    setLoading(true);
    api
      .get<NonConformanceListResponse>('nc/nonconformances/', {
        params: {
          business_unit: businessUnitId,
          page: paginationModel.page + 1,
          ...(search ? { search } : {}),
          ...(yearFilter !== 'all' ? { year: yearFilter } : {}),
          ...(riskRatingFilter !== 'all'
            ? { risk_rating_option: riskRatingFilter }
            : {}),
          ...(sortModel.length > 0 && sortModel[0].sort
            ? {
                ordering: `${
                  sortModel[0].sort === 'asc' ? '' : '-'
                }${
                  sortModel[0].field === 'risk_profile'
                    ? 'risk_rating_option__score'
                    : sortModel[0].field
                }`,
              }
            : {}),
        },
      })
      .then((res) => {
        setRows(res.data.results);
        setRowCount(res.data.count);
      })
      .catch((err) => console.error('Error loading non-conformances', err))
      .finally(() => setLoading(false));
  }, [
    businessUnitId,
    paginationModel,
    sortModel,
    search,
    yearFilter,
    riskRatingFilter,
    reloadToken,
  ]);

  useEffect(() => {
    if (!businessUnitId) {
      setRiskRatingOptions([]);
      return;
    }
    api
      .get<{ results: Array<{ id: number; name: string }> }>(
        'nc/risk-ratings/',
        {
          params: { business_unit: businessUnitId, is_active: true },
        },
      )
      .then((res) => {
        setRiskRatingOptions(res.data.results || []);
      })
      .catch((err) => console.error('Error loading risk ratings', err));
  }, [businessUnitId]);

  if (!businessUnitId) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Select a Business Unit to view non-conformances.
      </Typography>
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        mt: 2,
        bgcolor: 'background.paper',
        width: '100%',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="subtitle1">Non-Conformances</Typography>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <TextField
            size="small"
            label="Search Reference"
            placeholder="NC-BU-2026-0001"
            value={search}
            onChange={(e) => {
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
              setSearch(e.target.value);
            }}
          />
          <TextField
            select
            size="small"
            label="Year"
            value={yearFilter}
            onChange={(e) => {
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
              setYearFilter(e.target.value as any);
            }}
            sx={{ minWidth: 140 }}
          >
            {yearOptions.map((year) => (
              <MenuItem key={year} value={year}>
                {year === 'all' ? 'All years' : year}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Risk Rating"
            value={riskRatingFilter}
            onChange={(e) => {
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
              setRiskRatingFilter(e.target.value as any);
            }}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="all">All risk ratings</MenuItem>
            {riskRatingOptions.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.name}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Stack>

      <Box
        sx={{
          width: '100%',
          minHeight: 420,
          '& .MuiDataGrid-root': {
            minHeight: 420,
          },
          '& .MuiDataGrid-cell': {
            alignItems: 'flex-start',
          },
          overflowX: 'auto',
        }}
      >
        <DataGrid
          autoHeight
          rows={rows}
          columns={columns}
          rowCount={rowCount}
          loading={loading}
          getRowHeight={() => 'auto'}
          sx={{ minWidth: 1000 }}
          paginationMode="server"
          sortingMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          pageSizeOptions={[25, 50, 100]}
          disableRowSelectionOnClick
        />
      </Box>
    </Paper>
  );
}
