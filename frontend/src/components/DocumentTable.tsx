// src/components/DocumentTable.tsx
import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Chip,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  Button,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type {
  GridColDef,
  GridPaginationModel,
  GridSortModel,
} from '@mui/x-data-grid/models';

import api from '../api/client';

export interface Document {
  id: number;
  business_unit: number;
  business_unit_code: string;
  code: string;
  title: string;
  category: number | null;
  category_name: string | null;
  type: number | null;
  type_name: string | null;
  is_active: boolean;
  current_version: string;
  effective_date: string | null;
}

interface DocumentListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Document[];
}

interface DocumentTableProps {
  businessUnitId: number | '';
  categoryId?: number | '';
  typeId?: number | '';
  onSelectDocument?: (doc: Document) => void;
  onEditDocument?: (doc: Document) => void;
  onViewDocument?: (doc: Document) => void;
  reloadToken?: number;
  onFiltersChange?: (filters: {
    search: string;
    statusFilter: 'all' | 'active' | 'inactive';
    yearFilter: number | 'all';
    categoryId?: number | '';
    typeId?: number | '';
  }) => void;
}

export function DocumentTable({
  businessUnitId,
  categoryId,
  typeId,
  onSelectDocument,
  onEditDocument,
  onViewDocument,
  reloadToken = 0,
  onFiltersChange,
}: DocumentTableProps) {
  const [rows, setRows] = useState<Document[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0, // 0-based for DataGrid, DRF is 1-based
    pageSize: 25,
  });

  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: 'code', sort: 'asc' },
  ]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    'all',
  );
  const currentYear = new Date().getFullYear();
  const [yearFilter, setYearFilter] = useState<number | 'all'>(currentYear);
  const yearOptions = useMemo(() => {
    const years: Array<number | 'all'> = ['all'];
    for (let y = currentYear; y >= currentYear - 5; y -= 1) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  useEffect(() => {
    onFiltersChange?.({
      search,
      statusFilter,
      yearFilter,
      categoryId,
      typeId,
    });
  }, [search, statusFilter, yearFilter, categoryId, typeId, onFiltersChange]);

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: 'code',
        headerName: 'Code',
        flex: 0.8,
        minWidth: 120,
        sortable: true,
      },
      {
        field: 'title',
        headerName: 'Title',
        flex: 1.5,
        minWidth: 220,
        sortable: true,
      },
      {
        field: 'category_name',
        headerName: 'Category',
        flex: 1,
        minWidth: 150,
        sortable: false,
        // defensive: support both older params.row-style and newer signatures

      },
      {
        field: 'type_name',
        headerName: 'Type',
        flex: 1,
        minWidth: 150,
        sortable: false,

      },
      {
        field: 'current_version',
        headerName: 'Current Version',
        flex: 0.7,
        minWidth: 130,
        sortable: true,

      },
      {
        field: 'effective_date',
        headerName: 'Effective Date',
        flex: 0.8,
        minWidth: 140,
        sortable: true,

      },
      {
        field: 'is_active',
        headerName: 'Status',
        flex: 0.7,
        minWidth: 120,
        sortable: true,
        renderCell: (params) => (
          <Chip
            label={params.value ? 'Active' : 'Inactive'}
            size="small"
            color={params.value ? 'success' : 'default'}
            variant={params.value ? 'filled' : 'outlined'}
          />
        ),
      },
      {
        field: 'actions',
        headerName: 'Actions',
          flex: 0.7,
          minWidth: 320,
          sortable: false,
          filterable: false,
          disableColumnMenu: true,
          align: 'center',
          headerAlign: 'center',
          renderCell: (params) => (
            <Stack
              direction="column"
              spacing={1}
              alignItems="center"
              justifyContent="center"
              sx={{
                height: '100%',
                py: 1,
                width: '100%',
              }}
            >
              <Button
                size="small"
                variant="outlined"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDocument?.(params.row as Document);
                  
                }}
                sx={{
                height: '100%',
                // py: 1,
                width: '100%',
              }}
              >
                View
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditDocument?.(params.row as Document);
                }}
                sx={{
                height: '100%',
                // py: 1,
                width: '100%',
              }}
              >
                Edit
              </Button>

              <Button
                size="small"
                variant="outlined"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectDocument?.(params.row as Document);
                }}
                sx={{
                height: '100%',
                // py: 1,
                width: '100%',
              }}
              >
                Versions
              </Button>
            </Stack>
          ),
        },
    ],
    [onEditDocument, onSelectDocument, onViewDocument],
  );

  useEffect(() => {
    if (!businessUnitId) {
      setRows([]);
      setRowCount(0);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const params: Record<string, any> = {
          business_unit: businessUnitId,
          page: paginationModel.page + 1, // DRF is 1-based
        };

        if (search) {
          params.search = search;
        }

        if (statusFilter !== 'all') {
          params.is_active = statusFilter === 'active';
        }
        if (yearFilter !== 'all') {
          params.year = yearFilter;
        }
        if (categoryId) {
          params.category = categoryId;
        }
        if (typeId) {
          params.type = typeId;
        }

        if (sortModel.length > 0) {
          const { field, sort } = sortModel[0];
          if (sort) {
            const prefix = sort === 'asc' ? '' : '-';
            params.ordering = `${prefix}${field}`;
          }
        }

        const response = await api.get<DocumentListResponse>('dms/documents/', {
          params,
        });

        setRows(response.data.results);
        setRowCount(response.data.count);
      } catch (err) {
        console.error('Error loading documents', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    businessUnitId,
    categoryId,
    typeId,
    paginationModel,
    sortModel,
    search,
    statusFilter,
    yearFilter,
    reloadToken,
  ]);

  if (!businessUnitId) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Select a Business Unit to view its documents.
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
        <Typography variant="subtitle1">Documents</Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <TextField
            size="small"
            label="Search"
            placeholder="Code or title..."
            value={search}
            onChange={(e) => {
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
              setSearch(e.target.value);
            }}
          />
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => {
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
              setStatusFilter(e.target.value as any);
            }}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
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
        </Stack>
      </Stack>

      <Box
          sx={{
            width: '100%',
            minHeight: 420,             // make space even with 1 row
            '& .MuiDataGrid-root': {
              minHeight: 420,           // DataGrid itself must also respect min height
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
            paginationMode="server"
            sortingMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            sortModel={sortModel}
            onSortModelChange={setSortModel}
            pageSizeOptions={[25, 50, 100]}
            disableRowSelectionOnClick
            sx={{
              minWidth: 1000,
              // 1. Target the cell content container
              '& .MuiDataGrid-cell': {
                display: 'flex',
                alignItems: 'center', // Vertically center the content
                justifyContent: 'flex-start', // Keeps text left-aligned but allows container to fill
                whiteSpace: 'normal',    // Allows text to wrap into those 3 lines you mentioned
                // lineHeight: '1.2',       // Improves readability for multi-line data
                paddingTop: 1,       // Optional: adds a bit of breathing room
                paddingBottom: 1,    // for 'auto' height rows
              },
              // 2. Ensure headers remain centered too if needed
              '& .MuiDataGrid-columnHeaderTitleContainer': {
                alignItems: 'center',
              },
              '& .MuiDataGrid-cell > div': {
                width: '100%',
              }
            }}
          />
        </Box>

    </Paper>
  );
}
