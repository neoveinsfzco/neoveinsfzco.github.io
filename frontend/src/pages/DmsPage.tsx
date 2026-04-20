// src/pages/DmsPage.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Typography,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  useMediaQuery,
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

import { DocumentTable, type Document } from '../components/DocumentTable';
import { DocumentFormDialog } from '../components/DocumentFormDialog';
import { DocumentVersionsDrawer } from '../components/DocumentVersionsDrawer';
import api from '../api/client';

interface DmsPageProps {
  selectedBuId: number | '';
}

interface DocumentCategory {
  id: number;
  name: string;
}

interface DocumentType {
  id: number;
  name: string;
  category: number | null;
}

interface CategoryListResponse {
  results: DocumentCategory[];
}

interface TypeListResponse {
  results: DocumentType[];
}

export function DmsPage({ selectedBuId }: DmsPageProps) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null,
  );
  const [versionDrawerOpen, setVersionDrawerOpen] = useState(false);

  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState<Document | null>(null);
  const [documentsReloadToken, setDocumentsReloadToken] = useState(0);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [types, setTypes] = useState<DocumentType[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');
  const [selectedTypeId, setSelectedTypeId] = useState<number | ''>('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerTitle, setViewerTitle] = useState('');
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [tableFilters, setTableFilters] = useState({
    search: '',
    statusFilter: 'all' as 'all' | 'active' | 'inactive',
    yearFilter: new Date().getFullYear() as number | 'all',
    categoryId: '' as number | '',
    typeId: '' as number | '',
  });
  const [summary, setSummary] = useState<{
    active: number | null;
    pending: number | null;
    recent: number | null;
    loading: boolean;
  }>({
    active: null,
    pending: null,
    recent: null,
    loading: false,
  });

  const handleFiltersChange = useCallback(
    (next: {
      search: string;
      statusFilter: 'all' | 'active' | 'inactive';
      yearFilter: number | 'all';
      categoryId?: number | '';
      typeId?: number | '';
    }) => {
      setTableFilters((prev) => {
        const same =
          prev.search === next.search &&
          prev.statusFilter === next.statusFilter &&
          prev.yearFilter === next.yearFilter &&
          prev.categoryId === (next.categoryId ?? '') &&
          prev.typeId === (next.typeId ?? '');
        return same
          ? prev
          : {
              search: next.search,
              statusFilter: next.statusFilter,
              yearFilter: next.yearFilter,
              categoryId: next.categoryId ?? '',
              typeId: next.typeId ?? '',
            };
      });
    },
    [],
  );

  const hasBu = selectedBuId !== '';

  // Whenever BU changes, reset local state & trigger table reload
  useEffect(() => {
    setSelectedDocument(null);
    setVersionDrawerOpen(false);
    setDocumentDialogOpen(false);
    setSelectedCategoryId('');
    setSelectedTypeId('');
    setExpandedCategories([]);
    if (selectedBuId) {
      setDocumentsReloadToken((t) => t + 1);
    }
  }, [selectedBuId]);

  const handleSelectDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setVersionDrawerOpen(true);
  };

  const handleEditDocument = (doc: Document) => {
    setDocumentToEdit(doc);
    setDocumentDialogOpen(true);
  };

  const handleDocumentSaved = () => {
    setDocumentsReloadToken((t) => t + 1);
  };

  const handleToggleCategory = (categoryId: number) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  const handleSelectCategory = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    setSelectedTypeId('');
  };

  const handleSelectType = (categoryId: number | null, typeId: number) => {
    setSelectedCategoryId(categoryId || '');
    setSelectedTypeId(typeId);
  };

  const handleCloseViewer = () => {
    if (viewerUrl && viewerUrl.startsWith('blob:')) {
      URL.revokeObjectURL(viewerUrl);
    }
    setViewerUrl(null);
    setViewerOpen(false);
  };

  const handleViewDocument = async (doc: Document) => {
    setViewerOpen(true);
    setViewerTitle(`${doc.code} - ${doc.title}`);
    setViewerUrl(null);
    setViewerError(null);
    setViewerLoading(true);
    try {
      const response = await api.get('dms/versions/', {
        params: {
          document: doc.id,
          ordering: '-created_at',
          page_size: 1,
        },
      });
      const version = response.data.results?.[0];
      if (!version?.id) {
        setViewerError('No document file found for this record.');
        return;
      }
      const stamped = await api.get(`dms/versions/${version.id}/view/`, {
        responseType: 'blob',
      });
      const blobUrl = URL.createObjectURL(stamped.data);
      setViewerUrl(blobUrl);
    } catch (err) {
      console.error('Error loading document file', err);
      setViewerError('Failed to load the document file.');
    } finally {
      setViewerLoading(false);
    }
  };

  const categoryTypes = useMemo(() => {
    const map = new Map<number, DocumentType[]>();
    categories.forEach((category) => {
      map.set(
        category.id,
        types.filter((t) => t.category === category.id),
      );
    });
    return map;
  }, [categories, types]);

  const unassignedTypes = useMemo(
    () => types.filter((t) => !t.category),
    [types],
  );

  useEffect(() => {
    if (!hasBu) {
      setCategories([]);
      setTypes([]);
      return;
    }

    const fetchMeta = async () => {
      try {
        const [catRes, typeRes] = await Promise.all([
          api.get<CategoryListResponse>('dms/categories/', {
            params: { business_unit: selectedBuId, page_size: 1000 },
          }),
          api.get<TypeListResponse>('dms/types/', {
            params: { business_unit: selectedBuId, page_size: 1000 },
          }),
        ]);
        setCategories(catRes.data.results || []);
        setTypes(typeRes.data.results || []);
      } catch (err) {
        console.error('Error loading categories/types', err);
        setCategories([]);
        setTypes([]);
      }
    };

    fetchMeta();
  }, [selectedBuId, hasBu]);

  useEffect(() => {
    if (!hasBu) {
      setSummary({ active: null, pending: null, recent: null, loading: false });
      return;
    }

    const fetchSummary = async () => {
      setSummary((prev) => ({ ...prev, loading: true }));
      const baseDocumentParams: Record<string, any> = {
        business_unit: selectedBuId,
      };
      if (tableFilters.search) {
        baseDocumentParams.search = tableFilters.search;
      }
      if (tableFilters.yearFilter !== 'all') {
        baseDocumentParams.year = tableFilters.yearFilter;
      }
      if (tableFilters.categoryId) {
        baseDocumentParams.category = tableFilters.categoryId;
      }
      if (tableFilters.typeId) {
        baseDocumentParams.type = tableFilters.typeId;
      }

      const baseVersionParams: Record<string, any> = {
        document__business_unit: selectedBuId,
      };
      if (tableFilters.search) {
        baseVersionParams.search = tableFilters.search;
      }
      if (tableFilters.yearFilter !== 'all') {
        baseVersionParams.year = tableFilters.yearFilter;
      }
      if (tableFilters.categoryId) {
        baseVersionParams.document__category = tableFilters.categoryId;
      }
      if (tableFilters.typeId) {
        baseVersionParams.document__type = tableFilters.typeId;
      }
      if (tableFilters.statusFilter !== 'all') {
        baseVersionParams.document__is_active =
          tableFilters.statusFilter === 'active';
      }

      try {
        let activeCount = 0;
        if (tableFilters.statusFilter !== 'inactive') {
          const activeParams = {
            ...baseDocumentParams,
            is_active: true,
            page_size: 1,
          };
          const activeRes = await api.get('dms/documents/', {
            params: activeParams,
          });
          activeCount = activeRes.data?.count ?? 0;
        }

        const pendingStatuses = ['Draft', 'Prepared', 'Reviewed'];
        const pendingCounts = await Promise.all(
          pendingStatuses.map((status) =>
            api.get('dms/versions/', {
              params: {
                ...baseVersionParams,
                status,
                page_size: 1,
              },
            }),
          ),
        );
        const pending = pendingCounts.reduce(
          (sum, res) => sum + (res.data?.count ?? 0),
          0,
        );

        const recentRes = await api.get('dms/versions/', {
          params: {
            ...baseVersionParams,
            recent_days: 30,
            page_size: 1,
          },
        });

        setSummary({
          active: activeCount,
          pending,
          recent: recentRes.data?.count ?? 0,
          loading: false,
        });
      } catch (err) {
        console.error('Error loading DMS summary', err);
        setSummary({ active: 0, pending: 0, recent: 0, loading: false });
      }
    };

    fetchSummary();
  }, [hasBu, selectedBuId, tableFilters, documentsReloadToken]);

  return (
    <Box>
      {/* Header */}
      <Paper
        sx={{
          p: 2,
          mb: 2,
          bgcolor: 'background.paper',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
        >
          <Box>
            <Typography variant="h6">Document Management (DMS)</Typography>
            <Typography variant="body2" color="text.secondary">
              Select a Business Unit from the Left bar and manage its controlled
              documents and versions.
            </Typography>
          </Box>

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            alignItems={{ xs: 'stretch', md: 'center' }}
          >
            <Button
              variant="contained"
              size="small"
              onClick={() => navigate('/dms/new')}
              disabled={!hasBu}
            >
              New Document
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Simple overview cards (placeholder for KPIs) */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Paper
          variant="outlined"
          sx={{
            flex: 1,
            p: 3,
            borderRadius: 2,
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.6))',
          }}
        >
          <Typography variant="subtitle2" color="text.secondary">
            Active Documents
          </Typography>
          <Typography variant="h6">
            {summary.loading ? '...' : summary.active ?? '-'}
          </Typography>
          <Chip
            label={`Year: ${
              tableFilters.yearFilter === 'all' ? 'All' : tableFilters.yearFilter
            }`}
            size="small"
            variant="outlined"
            sx={{ mt: 1 }}
          />
        </Paper>
        <Paper
          variant="outlined"
          sx={{
            flex: 1,
            p: 3,
            borderRadius: 2,
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.6))',
          }}
        >
          <Typography variant="subtitle2" color="text.secondary">
            Pending Approval
          </Typography>
          <Typography variant="h6">
            {summary.loading ? '...' : summary.pending ?? '-'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Draft / Prepared / Reviewed
          </Typography>
        </Paper>
        <Paper
          variant="outlined"
          sx={{
            flex: 1,
            p: 3,
            borderRadius: 2,
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.6))',
          }}
        >
          <Typography variant="subtitle2" color="text.secondary">
            Recently Updated
          </Typography>
          <Typography variant="h6">
            {summary.loading ? '...' : summary.recent ?? '-'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Last 30 days
          </Typography>
        </Paper>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {/* Documents table */}
      {hasBu ? (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Paper
            variant="outlined"
            sx={{
              width: { xs: '100%', md: 320 },
              p: 2,
              borderRadius: 3,
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(245,247,250,0.7))',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
            }}
          >
            <Typography variant="subtitle1" sx={{ 
              mb: 1,
              fontWeight: 700 ,
              p:3,
              }}>
              Document Tree
            </Typography>
            <List disablePadding>
              <ListItemButton
                selected={!selectedCategoryId && !selectedTypeId}
                onClick={() => {
                  setSelectedCategoryId('');
                  setSelectedTypeId('');
                }}
                sx={{
                  mb: 0.5,
                  borderRadius: 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                  },
                }}
              >
                <ListItemIcon>
                  <FolderOpenIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="All Documents" />
              </ListItemButton>

              {categories.map((category) => {
                const isExpanded = expandedCategories.includes(category.id);
                const typeList = categoryTypes.get(category.id) || [];
                return (
                  <Box key={category.id}>
                    <ListItemButton
                      selected={selectedCategoryId === category.id && !selectedTypeId}
                      onClick={() => {
                        handleSelectCategory(category.id);
                        handleToggleCategory(category.id);
                      }}
                      sx={{
                        mb: 0.5,
                        borderRadius: 2,
                        '&.Mui-selected': {
                          bgcolor: 'primary.light',
                          color: 'primary.contrastText',
                        },
                      }}
                    >
                      <ListItemIcon>
                        <FolderIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={category.name} />
                      {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </ListItemButton>
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {typeList.map((type) => (
                          <ListItemButton
                            key={type.id}
                            sx={{ pl: 4, mb: 0.5, borderRadius: 2 }}
                            selected={selectedTypeId === type.id}
                            onClick={() =>
                              handleSelectType(category.id, type.id)
                            }
                          >
                            <ListItemIcon>
                              <DescriptionIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={type.name} />
                          </ListItemButton>
                        ))}
                      </List>
                    </Collapse>
                  </Box>
                );
              })}

              {unassignedTypes.length > 0 && (
                <Box>
                  <ListItemButton
                    onClick={() => handleToggleCategory(-1)}
                    sx={{
                      mb: 0.5,
                      borderRadius: 2,
                    }}
                  >
                    <ListItemIcon>
                      <FolderIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Unassigned Types" />
                    {expandedCategories.includes(-1) ? (
                      <ExpandLessIcon />
                    ) : (
                      <ExpandMoreIcon />
                    )}
                  </ListItemButton>
                  <Collapse in={expandedCategories.includes(-1)} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {unassignedTypes.map((type) => (
                        <ListItemButton
                          key={type.id}
                          sx={{ pl: 4, mb: 0.5, borderRadius: 2 }}
                          selected={selectedTypeId === type.id}
                          onClick={() => handleSelectType(null, type.id)}
                        >
                          <ListItemIcon>
                            <DescriptionIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={type.name} />
                        </ListItemButton>
                      ))}
                    </List>
                  </Collapse>
                </Box>
              )}
            </List>
          </Paper>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <DocumentTable
              businessUnitId={selectedBuId}
              categoryId={selectedCategoryId}
              typeId={selectedTypeId}
              onSelectDocument={handleSelectDocument}
              onEditDocument={handleEditDocument}
              onViewDocument={handleViewDocument}
              reloadToken={documentsReloadToken}
              onFiltersChange={handleFiltersChange}
            />
          </Box>
        </Stack>
      ) : (
        <Paper
          variant="outlined"
          sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}
        >
          <Typography variant="body2" color="text.secondary">
            Please select a Business Unit to view documents.
          </Typography>
        </Paper>
      )}

      {/* Edit document dialog (used only for editing existing docs) */}
      <DocumentFormDialog
        open={documentDialogOpen}
        onClose={() => setDocumentDialogOpen(false)}
        businessUnitId={selectedBuId}
        documentToEdit={documentToEdit}
        onSaved={handleDocumentSaved}
      />

      {/* Versions drawer */}
      <DocumentVersionsDrawer
        open={versionDrawerOpen}
        onClose={() => setVersionDrawerOpen(false)}
        documentId={selectedDocument?.id ?? null}
        documentTitle={
          selectedDocument
            ? `${selectedDocument.code} - ${selectedDocument.title}`
            : ''
        }
        onEditDocument={() => {
          if (selectedDocument) {
            handleEditDocument(selectedDocument);
          }
        }}
      />

      <Dialog
        open={viewerOpen}
        onClose={handleCloseViewer}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>{viewerTitle || 'Document Viewer'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {viewerLoading && (
            <Typography variant="body2" color="text.secondary">
              Loading document...
            </Typography>
          )}
          {viewerError && (
            <Typography variant="body2" color="error">
              {viewerError}
            </Typography>
          )}
          {viewerUrl && (
            <Box sx={{ width: '100%', height: '70vh' }}>
              <iframe
                title="Document Viewer"
                src={viewerUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
