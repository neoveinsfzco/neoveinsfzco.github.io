// src/pages/LoginPage.tsx
import { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Stack,
  IconButton,
  InputAdornment,
  Link,
  useTheme,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';

import api from '../api/client';
import { saveTokens, type TokenPair, saveUsername } from '../auth/tokenStorage';
import NqmLogo from '../assets/NQM7-nobackground-3.png';

interface LoginPageProps {
  onLoginSuccess?: (username: string) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const theme = useTheme();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginTheme = createTheme({
    palette: {
      mode: theme.palette.mode,
      primary: {
        main: '#003E68',
        light: '#0079C9',
        dark: '#002F4F',
      },
      secondary: {
        main: '#008383',
        light: '#008383CC',
      },
      background: {
        default: '#e8f0fb',
        paper: '#ffffff',
      },
    },
    shape: {
      borderRadius: 16,
    },
    typography: {
      fontFamily:
        'Roboto, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError('Please enter username and password.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post<TokenPair>('auth/token/', {
        username,
        password,
      });

      saveTokens(response.data);
      saveUsername(username);
      setPassword('');

      if (onLoginSuccess) {
        onLoginSuccess(username);
      }

      navigate('/', { replace: true });
    } catch (err) {
      console.error('Login failed', err);
      setError('Invalid credentials or server error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemeProvider theme={loginTheme}>
      <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        background:
          theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, #e8f0fb, #ffffff)'
            : 'linear-gradient(135deg, #0a1929, #132f4c)',
      }}
      >
      <Card
        elevation={6}
        sx={{
          width: '100%',
          maxWidth: 420,
          p: 4,
          borderRadius: 4,
        }}
      >
        <Box display="flex" alignItems="center" mb={2} gap={2}>
          <Box
            component="img"
            src={NqmLogo}
            alt="NQM Logo"
            sx={{ width: 48, height: 48, objectFit: 'contain' }}
          />
          <Box>
            <Typography variant="h5" fontWeight={600}>
              NQM
            </Typography>
            <Typography variant="body2" color="text.secondary">
              NeoVeins Quality Management
            </Typography>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" mb={3}>
          Sign in to access your documents, incidents, and workflows.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2}>
            <TextField
              label="Email or Username"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MailOutlineIcon color="primary" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Password"
              fullWidth
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon color="primary" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {error && (
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={submitting}
              sx={{
                py: 1.4,
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 3,
              }}
            >
              {submitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </Stack>
        </Box>
      </Card>
      </Box>
    </ThemeProvider>
  );
}
