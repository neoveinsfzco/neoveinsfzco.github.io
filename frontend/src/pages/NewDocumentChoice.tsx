// src/pages/NewDocumentChoice.tsx
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface NewDocumentChoiceProps {
  hasBu: boolean;
}

export function NewDocumentChoice({ hasBu }: NewDocumentChoiceProps) {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        maxWidth: 700,
        mx: 'auto',
        mt: 2,
      }}
    >
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Create Document
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Choose how you want to create your document. You can either use the
        built-in editor (similar to a word processor) or upload an existing PDF.
      </Typography>

      {!hasBu && (
        <Card sx={{ mb: 2 }} variant="outlined">
          <CardContent>
            <Typography variant="body2" color="error">
              Please select a Business Unit first from the sidebar. Documents
              must belong to a Business Unit.
            </Typography>
          </CardContent>
        </Card>
      )}

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', sm: 'flex-start' }}
      >
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Use Document Builder
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Create and format the document using a rich text editor, similar
              to Microsoft Word. We will store the content as a file and create
              the initial version.
            </Typography>
            <Button
              variant="contained"
              disabled={!hasBu}
              onClick={() => navigate('/dms/new/builder')}
            >
              Open Builder
            </Button>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Upload PDF
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              If you already have a PDF document, upload it and enter the
              metadata. We will create the document record and its initial
              version.
            </Typography>
            <Button
              variant="outlined"
              disabled={!hasBu}
              onClick={() => navigate('/dms/new/upload')}
            >
              Upload PDF
            </Button>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
