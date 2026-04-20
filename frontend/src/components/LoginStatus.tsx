// src/components/LoginStatus.tsx
import { Typography } from '@mui/material';

interface LoginStatusProps {
  isAuthenticated: boolean;
}

export const LoginStatus: React.FC<LoginStatusProps> = ({ isAuthenticated }) => {
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Typography variant="body2">
      Logged in
    </Typography>
  );
};
