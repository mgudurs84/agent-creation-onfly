import { useState } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Alert,
  Chip,
  Paper,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SettingsIcon from '@mui/icons-material/Settings';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import ChatIcon from '@mui/icons-material/Chat';
import { QueryClient, QueryClientProvider, useQuery, useMutation } from '@tanstack/react-query';
import type { AgentConfig } from './types';
import { parseRequirements, healthCheck } from './services/api';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
        },
      },
    },
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [request, setRequest] = useState('');

  const { data: health, error: healthError } = useQuery({
    queryKey: ['health'],
    queryFn: healthCheck,
  });

  const parseMutation = useMutation({
    mutationFn: parseRequirements,
    onSuccess: (data) => {
      setConfig(data);
    },
  });

  const handleGenerate = () => {
    if (request.trim()) {
      parseMutation.mutate(request);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <SmartToyIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Vertex AI Agent Builder
          </Typography>
          {health && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip 
                label={health.project_id} 
                size="small" 
                color="default"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
              <Chip 
                label={health.location} 
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {healthError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Failed to connect to backend API. Please ensure the server is running.
          </Alert>
        )}

        {health && !health.has_credentials && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Google Cloud credentials not configured. Please add your service account JSON to the GOOGLE_APPLICATION_CREDENTIALS_JSON secret.
          </Alert>
        )}

        {parseMutation.isError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Failed to parse requirements: {(parseMutation.error as Error)?.message || 'Unknown error'}
          </Alert>
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoFixHighIcon color="primary" />
              Describe Your Agent
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={5}
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              placeholder="Describe what kind of agent you want to create..."
              variant="outlined"
              sx={{ mb: 2 }}
            />

            <Button
              variant="contained"
              size="large"
              onClick={handleGenerate}
              disabled={parseMutation.isPending || !request.trim()}
              startIcon={parseMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <AutoFixHighIcon />}
              fullWidth
            >
              {parseMutation.isPending ? 'Generating...' : 'Generate Configuration'}
            </Button>
          </Paper>

          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SettingsIcon color="primary" />
              Agent Configuration
            </Typography>
            {config ? (
              <TextField
                fullWidth
                multiline
                rows={10}
                value={JSON.stringify(config, null, 2)}
                variant="outlined"
                sx={{ fontFamily: 'monospace' }}
              />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography color="text.secondary">Generate a configuration first.</Typography>
              </Box>
            )}
          </Paper>

          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <RocketLaunchIcon color="primary" />
              Deploy Agent
            </Typography>
            <Alert severity="info">
              Generate and configure your agent first before deploying.
            </Alert>
          </Paper>

          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ChatIcon color="primary" />
              Test Your Agent
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography color="text.secondary">Deploy an agent first to test it here.</Typography>
            </Box>
          </Paper>
        </Box>

        <Box sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>
          <Typography variant="body2">
            Built with React, Material UI & Vertex AI | Project: {health?.project_id || 'Loading...'} | Location: {health?.location || 'Loading...'}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
