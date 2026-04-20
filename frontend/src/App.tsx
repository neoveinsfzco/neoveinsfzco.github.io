// src/App.tsx
import { useContext, useState } from 'react';
import {
  AppBar,
  Box,
  Container,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  Stack,
  Button,
  Snackbar,
  Alert,
  Drawer,
  Divider,
  Chip,
  IconButton,
  ButtonBase,
  Fab,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Link as RouterLink,
  Routes,
  Route,
  useLocation,
  Navigate,
} from 'react-router-dom';

import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import MenuIcon from '@mui/icons-material/Menu';
import DescriptionIcon from '@mui/icons-material/Description'; // Icon for DMS
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssessmentIcon from '@mui/icons-material/Assessment';   // Icon for IR
import ReportProblemIcon from '@mui/icons-material/ReportProblem'; // Icon for NC
import SettingsIcon from '@mui/icons-material/Settings';
import SchoolIcon from '@mui/icons-material/School';

import { clearTokens, getAccessToken, getUsername } from './auth/tokenStorage';
import { LoginStatus } from './components/LoginStatus';
import { BusinessUnitSelector } from './components/BusinessUnitSelector';
import { DmsPage } from './pages/DmsPage';
import { IrPage } from './pages/IrPage';
import { NcPage } from './pages/NcPage';
import { IncidentReportPage } from './pages/IncidentReportPage';
import LoginPage from './pages/LoginPage';
import { NewDocumentChoice } from './pages/NewDocumentChoice';
import { DocumentBuilderPage } from './pages/DocumentBuilderPage';
import { DocumentUploadPage } from './pages/DocumentUploadPage';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { SettingsPage } from './pages/SettingsPage';
import { TrainingPage } from './pages/TrainingPage';
import { TrainingCoursePage } from './pages/TrainingCoursePage';
import { ErrorBoundary } from './components/ErrorBoundary';
import logo from './assets/NQM7-nobackground-3.png';

import { ColorModeContext } from './theme/theme';
import type { BusinessUnit } from './types/BusinessUnit';

const DRAWER_WIDTH = 260;
const SELECTED_BU_ID_KEY = 'neo_qms_selected_bu_id';
const SELECTED_BU_NAME_KEY = 'neo_qms_selected_bu_name';

interface AppShellProps {
  selectedBuId: number | '';
  selectedBuName: string | null;
  onChangeBu: (id: number | '', bu: BusinessUnit | null) => void;
  isAuthenticated: boolean;
  onLogout: () => void;
  currentUsername: string | null;
}

function AppShell({
  selectedBuId,
  selectedBuName,
  onChangeBu,
  // isAuthenticated,
  onLogout,
  currentUsername,
}: AppShellProps) {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isActive = (path: string) =>
    location.pathname === path ;
    // location.pathname === path || (path === '/dms' && location.pathname === '/');

  const hasBu = selectedBuId !== '';

  const sidebarContent = (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 'bold' }}>
        Business Unit
      </Typography>
      <BusinessUnitSelector value={selectedBuId} onChange={onChangeBu} />

      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 'bold' }}>
        Dashboard
      </Typography>
      <List component="nav" disablePadding>
        <ListItem disablePadding>
          <ListItemButton
            component={RouterLink}
            to="/dashboard"
            selected={isActive('/dashboard')}
            disabled={!hasBu}
            onClick={() => setMobileSidebarOpen(false)}
          >
            <ListItemIcon><DashboardIcon color={isActive('/dashboard') ? 'primary' : 'inherit'} /></ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>
      </List>
      <Divider sx={{ my: 2 }} />
      {/* --- NEW NAVIGATION SECTION --- */}
      <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 'bold' }}>
        Modules
      </Typography>
      <List component="nav" disablePadding>
        <ListItem disablePadding>
          <ListItemButton
            component={RouterLink}
            to="/dms"
            selected={isActive('/dms')}
            disabled={!hasBu}
            onClick={() => setMobileSidebarOpen(false)}
          >
            <ListItemIcon><DescriptionIcon color={isActive('/dms') ? 'primary' : 'inherit'} /></ListItemIcon>
            <ListItemText primary="Documents" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            component={RouterLink}
            to="/ir"
            selected={isActive('/ir')}
            disabled={!hasBu}
            onClick={() => setMobileSidebarOpen(false)}
          >
            <ListItemIcon><AssessmentIcon color={isActive('/ir') ? 'primary' : 'inherit'} /></ListItemIcon>
            <ListItemText primary="Incidents" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            component={RouterLink}
            to="/nc"
            selected={isActive('/nc')}
            disabled={!hasBu}
            onClick={() => setMobileSidebarOpen(false)}
          >
            <ListItemIcon><ReportProblemIcon color={isActive('/nc') ? 'primary' : 'inherit'} /></ListItemIcon>
            <ListItemText primary="Non-Conformance" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            component={RouterLink}
            to="/training"
            selected={isActive('/training')}
            disabled={!hasBu}
            onClick={() => setMobileSidebarOpen(false)}
          >
            <ListItemIcon><SchoolIcon color={isActive('/training') ? 'primary' : 'inherit'} /></ListItemIcon>
            <ListItemText primary="Training" />
          </ListItemButton>
        </ListItem>
      </List>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 'bold' }}>
        Admin
      </Typography>
      <List component="nav" disablePadding>
        <ListItem disablePadding>
          <ListItemButton
            component={RouterLink}
            to="/settings"
            selected={isActive('/settings')}
            disabled={!hasBu}
            onClick={() => setMobileSidebarOpen(false)}
          >
            <ListItemIcon><SettingsIcon color={isActive('/settings') ? 'primary' : 'inherit'} /></ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
      </List>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 'bold' }}>
        Account
      </Typography>
      <Button
        variant="outlined"
        fullWidth
        size="small"
        onClick={() => {
          setMobileSidebarOpen(false);
          onLogout();
        }}
      >
        Logout
      </Button>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          borderRadius: 0,
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          {/* Wrap Logo and Text in a ButtonBase linked to home */}
          <ButtonBase
            component={RouterLink}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              borderRadius: 2,
              px: 1, // Slight padding so the ripple looks good
              py: 0.5,
              transition: 'opacity 0.2s',
              '&:hover': { opacity: 0.8 }
            }}
          >
            <Box
              component="img"
              sx={{ height: 40, width: 40, objectFit: 'contain' }}
              alt="NQM logo"
              src={logo}
            />
            <Typography 
              variant={isMobile ? 'subtitle1' : 'h6'}
              sx={{ 
                color: theme.palette.mode === 'light' ? '#0F172A' : '#E2E8F0',
                textDecoration: 'none' // Ensures no link underline appears
              }}
            >
              NQM
            </Typography>
          </ButtonBase>
          {/* <Box component="img" sx={{ height: 40, width: 40, objectFit: 'contain' }} alt="NQM logo" src={logo} /> */}
          {/* <Typography variant={isMobile ? 'subtitle1' : 'h6'}>NQM</Typography> */}
          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mr: 1 }}>
            <Typography variant="body2">{currentUsername ? currentUsername : 'User'}</Typography>
            <Chip
              size="small"
              label={hasBu ? `BU: ${selectedBuName ?? selectedBuId}` : 'No BU selected'}
              color="secondary"
              variant={hasBu ? 'filled' : 'outlined'}
            />
          </Stack>
          {!isMobile && <LoginStatus isAuthenticated />}
          <IconButton size="small" sx={{ ml: 1 }} onClick={colorMode.toggleColorMode}>
            {theme.palette.mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      {!isMobile && (
        <Drawer
          variant="permanent"
          anchor="left"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              pt: 8,
              backgroundColor:
                theme.palette.mode === 'light'
                  ? 'rgba(255, 255, 255, 0.78)'
                  : 'rgba(15, 23, 42, 0.72)',
              backdropFilter: 'blur(14px)',
              borderRight: '1px solid rgba(148, 163, 184, 0.25)',
              boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          // Calculate width to prevent overflow: 100% minus the sidebar width
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          // ml: { xs: 0, sm: `${DRAWER_WIDTH}px` },
          minHeight: '100vh',
          overflowX: 'hidden', // Extra safety to prevent any horizontal scroll
        }}
      >
        <Toolbar />
        <Container
          maxWidth={false}
          sx={{
            py: 3,
            px: { xs: 2, sm: 3, md: 1 },
            maxWidth: { xs: '100%', md: '90%' },
            ml: { xs: 0, sm: 'auto' },
          }}
        >
          {/* Module navigation buttons removed from here as they are now in the sidebar */}

          <Routes>
            <Route path="/" element={<HomePage selectedBuId={selectedBuId} selectedBuName={selectedBuName} onChangeBu={onChangeBu} />} />
            <Route path="/dashboard" element={<DashboardPage selectedBuId={selectedBuId} selectedBuName={selectedBuName} onChangeBu={onChangeBu} />} />
            <Route path="/dms" element={<DmsPage selectedBuId={selectedBuId} />} />
            <Route path="/dms/new" element={<NewDocumentChoice hasBu={selectedBuId !== ''} />} />
            <Route path="/dms/new/builder" element={<DocumentBuilderPage selectedBuId={selectedBuId} selectedBuName={selectedBuName} />} />
            <Route path="/dms/new/upload" element={<DocumentUploadPage selectedBuId={selectedBuId} selectedBuName={selectedBuName} />} />
            <Route path="/ir" element={<IrPage selectedBuId={selectedBuId} />} />
            <Route path="/ir/report/:incidentId" element={<IncidentReportPage />} />
            <Route path="/nc" element={<NcPage selectedBuId={selectedBuId} />} />
            <Route path="/training" element={<TrainingPage selectedBuId={selectedBuId} />} />
            <Route path="/training/course/:courseId" element={<TrainingCoursePage />} />
            <Route path="/settings" element={<SettingsPage selectedBuId={selectedBuId} />} />
          </Routes>
        </Container>
      </Box>

      {isMobile && (
        <>
          <Drawer
            variant="temporary"
            anchor="left"
            open={mobileSidebarOpen}
            onClose={() => setMobileSidebarOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              [`& .MuiDrawer-paper`]: {
                width: '80%',
                boxSizing: 'border-box',
                pt: 8,
                backgroundColor:
                  theme.palette.mode === 'light'
                    ? 'rgba(255, 255, 255, 0.86)'
                    : 'rgba(15, 23, 42, 0.82)',
                backdropFilter: 'blur(14px)',
                borderRight: '1px solid rgba(148, 163, 184, 0.25)',
              },
            }}
          >
            {sidebarContent}
          </Drawer>
          <Fab
            color="primary"
            onClick={() => setMobileSidebarOpen(true)}
            sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: (t) => t.zIndex.drawer + 2 }}
          >
            <MenuIcon />
          </Fab>
        </>
      )}
    </Box>
  );
}

// ... (Rest of the root App component remains the same)
export default function App() {
  const [selectedBuId, setSelectedBuId] = useState<number | ''>(() => {
    const raw = localStorage.getItem(SELECTED_BU_ID_KEY);
    if (!raw) return '';
    const num = Number(raw);
    return Number.isNaN(num) ? '' : num;
  });

  const [selectedBuName, setSelectedBuName] = useState<string | null>(() => {
    const name = localStorage.getItem(SELECTED_BU_NAME_KEY);
    return name || null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getAccessToken());
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const [currentUsername, setCurrentUsername] = useState<string | null>(getUsername());

  const handleLoginSuccess = (username: string) => {
    setIsAuthenticated(true);
    setCurrentUsername(username);
    setShowLoginSuccess(true);
  };

  const handleLogout = () => {
    clearTokens();
    setIsAuthenticated(false);
    setSelectedBuId('');
    setSelectedBuName(null);
    localStorage.removeItem(SELECTED_BU_ID_KEY);
    localStorage.removeItem(SELECTED_BU_NAME_KEY);
  };

  const handleCloseSnackbar = () => setShowLoginSuccess(false);

  const handleBuChange = (id: number | '', bu: BusinessUnit | null) => {
    setSelectedBuId(id);
    setSelectedBuName(bu ? bu.name : null);
    if (id === '') {
      localStorage.removeItem(SELECTED_BU_ID_KEY);
      localStorage.removeItem(SELECTED_BU_NAME_KEY);
    } else {
      localStorage.setItem(SELECTED_BU_ID_KEY, String(id));
      localStorage.setItem(SELECTED_BU_NAME_KEY, bu?.name ?? '');
    }
  };

  return (
    <ErrorBoundary>
      <Box sx={{ minHeight: '100vh' }}>
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/*" element={isAuthenticated ? <AppShell selectedBuId={selectedBuId} selectedBuName={selectedBuName} onChangeBu={handleBuChange} isAuthenticated={isAuthenticated} onLogout={handleLogout} currentUsername={currentUsername} /> : <Navigate to="/login" replace />} />
        </Routes>
        <Snackbar open={showLoginSuccess} autoHideDuration={3000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert onClose={handleCloseSnackbar} severity="success" variant="filled" sx={{ width: '100%' }}>Login successful</Alert>
        </Snackbar>
      </Box>
    </ErrorBoundary>
  );
}
