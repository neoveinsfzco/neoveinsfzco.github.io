// src/pages/DashboardPage.tsx
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Skeleton,
  Snackbar,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Grid from '@mui/material/Grid';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { BusinessUnitSelector } from '../components/BusinessUnitSelector';
import type { BusinessUnit } from '../types/BusinessUnit';
import api from '../api/client';

// ---------------- Types ----------------
type DashboardSummary = {
  kpis: {
    total_docs: number;
    active_docs: number;
    pending_versions: number;
    incidents: number;
    nonconformances: number;
  };
  trend: { day: string; incidents: number; nc: number }[];
  doc_status: { status: string; value: number }[];
  recent_docs: {
    id: number;
    code: string;
    title: string;
    current_version: string;
    effective_date: string | null;
  }[];
  recent_activity: { type: string; title: string; status: string; when: string }[];
};

async function fetchDashboardSummary(businessUnitId: number) {
  const res = await api.get<DashboardSummary>('dashboard/summary/', {
    params: { business_unit: businessUnitId },
  });
  return res.data;
}

// ---------------- UI helpers ----------------
function AnimatedNumber({ value, duration = 550 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const from = display;
    const to = value;

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const next = Math.round(from + (to - from) * t);
      setDisplay(next);
      if (t < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{display}</>;
}

function formatDayLabel(iso: string) {
  // iso: YYYY-MM-DD
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ---------------- Component ----------------
interface DashboardPageProps {
  selectedBuId: number | '';
  selectedBuName: string | null;
  onChangeBu: (id: number | '', bu: BusinessUnit | null) => void;
}

export function DashboardPage({ selectedBuId, selectedBuName, onChangeBu }: DashboardPageProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const hasBu = selectedBuId !== '';

  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string>('Business Unit selected');

  const COLORS = useMemo(
    () => [theme.palette.secondary.main, theme.palette.primary.light, theme.palette.error.main],
    [theme.palette.secondary.main, theme.palette.primary.light, theme.palette.error.main],
  );

  // Load dashboard data whenever BU changes
  useEffect(() => {
    setData(null);
    setLoadErr(null);

    if (!hasBu) return;

    setLoading(true);
    fetchDashboardSummary(selectedBuId as number)
      .then((res) => setData(res))
      .catch((e) => {
        console.error('Dashboard summary error', e);
        setLoadErr('Failed to load dashboard data. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [hasBu, selectedBuId]);

  useEffect(() => {
    if (hasBu) {
      setToastMsg(`Business Unit: ${selectedBuName ?? selectedBuId}`);
      setToastOpen(true);
    }
  }, [hasBu, selectedBuId, selectedBuName]);

  const kpiCards = useMemo(() => {
    const k = data?.kpis;
    return [
      {
        label: 'Incident Reports',
        value: k?.incidents ?? 0,
        accent: theme.palette.primary.main,
        helper: 'Total incidents for this BU',
      },
      {
        label: 'Non-Conformances',
        value: k?.nonconformances ?? 0,
        accent: theme.palette.secondary.main,
        helper: 'Total NCs for this BU',
      },
      {
        label: 'Pending Versions',
        value: k?.pending_versions ?? 0,
        accent: theme.palette.warning.main,
        helper: 'Versions not Approved/Archived',
      },
      {
        label: 'Total Documents',
        value: k?.total_docs ?? 0,
        accent: theme.palette.primary.light,
        helper: 'All documents for this BU',
      },
      {
        label: 'Active Documents',
        value: k?.active_docs ?? 0,
        accent: theme.palette.success.main,
        helper: 'Documents marked active',
      },
    ];
  }, [
    data?.kpis,
    theme.palette.primary.main,
    theme.palette.primary.light,
    theme.palette.secondary.main,
    theme.palette.warning.main,
    theme.palette.success.main,
  ]);

  const trendData = useMemo(() => {
    const t = data?.trend ?? [];
    return t.map((x) => ({
      name: formatDayLabel(x.day),
      incidents: x.incidents,
      nc: x.nc,
    }));
  }, [data?.trend]);

  const statusData = useMemo(() => {
    const s = data?.doc_status ?? [];
    // keep top 3 for pie, group rest into "Other"
    if (s.length <= 3) return s.map((x) => ({ name: x.status, value: x.value }));
    const top = s.slice(0, 3);
    const other = s.slice(3).reduce((acc, x) => acc + x.value, 0);
    return [...top.map((x) => ({ name: x.status, value: x.value })), { name: 'Other', value: other }];
  }, [data?.doc_status]);

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography
            variant={isMobile ? 'h5' : 'h4'}
            sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}
          >
            Analytics Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {hasBu ? `Monitoring: ${selectedBuName ?? selectedBuId}` : 'Please select a Business Unit to view analytics'}
          </Typography>
        </Box>

        {/* BU selector on dashboard (optional; you also have it in sidebar/topbar) */}
        <Card sx={{ width: { xs: '100%', sm: 360 } }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main' }}>
              Active Business Unit
            </Typography>
            <BusinessUnitSelector value={selectedBuId} onChange={onChangeBu} />
          </CardContent>
        </Card>
      </Stack>

      {!hasBu && (
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Select a Business Unit to load KPIs and analytics charts.
            </Typography>
          </CardContent>
        </Card>
      )}

      {hasBu && (
        <Stack spacing={3} sx={{ width: '100%' }}>
          {/* Error state */}
          {loadErr && (
            <Alert severity="error" variant="outlined">
              {loadErr}
            </Alert>
          )}

          {/* KPI cards */}
          <Grid container spacing={2} sx={{ width: '100%' }}>
            {kpiCards.map((kpi, idx) => (
              <Grid key={idx} xs={12} sm={6} md={4} lg={3}>
                <Card
                  sx={{
                    height: '100%',
                    borderLeft: `6px solid ${kpi.accent}`,
                  }}
                >
                  <CardContent>
                    <Typography variant="overline" color="text.secondary">
                      {kpi.label}
                    </Typography>

                    {loading ? (
                      <Skeleton variant="text" height={48} />
                    ) : (
                      <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                        <AnimatedNumber value={kpi.value} />
                      </Typography>
                    )}

                    <Typography variant="caption" color="text.secondary">
                      {kpi.helper}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Charts directly BELOW BU card (as you requested) and wide */}
          <Grid container spacing={2} sx={{ width: '100%' }}>
            <Grid xs={12} lg={8}>
              <Card
                sx={{
                  width: '100%',
                  minHeight: 420,
                }}
              >
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    28-Day Trends (Incidents vs NC)
                  </Typography>

                  <Box sx={{ flex: 1, width: '100%', minHeight: 320 }}>
                    {loading ? (
                      <Skeleton variant="rounded" height={320} />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData}>
                          <defs>
                            <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.25} />
                              <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                          <XAxis dataKey="name" stroke={theme.palette.text.secondary} fontSize={12} />
                          <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                          <ReTooltip
                            contentStyle={{
                              backgroundColor: theme.palette.background.paper,
                              borderRadius: 12,
                              border: `1px solid ${theme.palette.divider}`,
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="incidents"
                            stroke={theme.palette.primary.main}
                            fill="url(#colorPrimary)"
                            strokeWidth={3}
                          />
                          <Area
                            type="monotone"
                            dataKey="nc"
                            stroke={theme.palette.secondary.main}
                            fill="transparent"
                            strokeWidth={3}
                            strokeDasharray="6 5"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </Box>

                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Data is scoped by BU.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid xs={12} lg={4}>
              <Card sx={{ width: '100%', minHeight: 420 }}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Document Version Status
                  </Typography>

                  <Box sx={{ flex: 1, width: '100%', minHeight: 320 }}>
                    {loading ? (
                      <Skeleton variant="rounded" height={320} />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            innerRadius={isMobile ? 55 : 75}
                            outerRadius={isMobile ? 85 : 105}
                            paddingAngle={7}
                            dataKey="value"
                          >
                            {statusData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <ReTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Stack direction="row" justifyContent="center" spacing={2} flexWrap="wrap" sx={{ mt: 1 }}>
                    {statusData.map((entry, i) => (
                      <Stack key={entry.name} direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: COLORS[i % COLORS.length] }} />
                        <Typography variant="caption">{entry.name}</Typography>
                        <Chip size="small" variant="outlined" label={entry.value} />
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Recent activity timeline */}
          <Card sx={{ width: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Recent Activity
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Latest document version actions for this BU.
              </Typography>

              {loading ? (
                <Stack spacing={1}>
                  <Skeleton variant="text" />
                  <Skeleton variant="text" />
                  <Skeleton variant="text" />
                </Stack>
              ) : (
                <Stack spacing={1.2}>
                  {(data?.recent_activity ?? []).slice(0, 8).map((a, idx) => (
                    <Stack
                      key={`${a.title}-${idx}`}
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1}
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      justifyContent="space-between"
                      sx={{
                        p: 1.2,
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2">{a.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatWhen(a.when)}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={a.status}
                        color={
                          a.status === 'Approved'
                            ? 'success'
                            : a.status === 'Draft'
                            ? 'default'
                            : a.status === 'Archived'
                            ? 'warning'
                            : 'secondary'
                        }
                        variant={a.status === 'Draft' ? 'outlined' : 'filled'}
                      />
                    </Stack>
                  ))}

                  {(data?.recent_activity ?? []).length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No recent activity yet.
                    </Typography>
                  )}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Stack>
      )}

      {/* Small BU toast */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={2200}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" variant="filled" onClose={() => setToastOpen(false)}>
          {toastMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
