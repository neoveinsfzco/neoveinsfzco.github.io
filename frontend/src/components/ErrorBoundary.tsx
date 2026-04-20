import React from 'react';
import { Box, Button, Typography } from '@mui/material';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('UI ErrorBoundary caught:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3 }}>
          <Box textAlign="center">
            <Typography variant="h6" gutterBottom>
              Something went wrong.
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Please refresh the page or contact support if the problem persists.
            </Typography>
            <Button variant="contained" onClick={this.handleReload}>
              Refresh
            </Button>
          </Box>
        </Box>
      );
    }
    return this.props.children;
  }
}
