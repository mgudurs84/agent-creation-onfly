import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Alert,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { AgentConfig } from '../types';

interface ConfigEditorProps {
  config: AgentConfig | null;
  onConfigChange: (config: AgentConfig) => void;
}

export default function ConfigEditor({ config, onConfigChange }: ConfigEditorProps) {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (config) {
      setJsonText(JSON.stringify(config, null, 2));
      setError(null);
    }
  }, [config]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setJsonText(text);

    try {
      const parsed = JSON.parse(text);
      setError(null);
      onConfigChange(parsed);
    } catch (err) {
      setError('Invalid JSON syntax');
    }
  };

  if (!config) {
    return (
      <Paper elevation={2} sx={{ p: 3, height: '100%', minHeight: 400 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon color="primary" />
          Review & Edit Configuration
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 300,
            bgcolor: 'action.hover',
            borderRadius: 1,
          }}
        >
          <Typography color="text.secondary">
            Generate a configuration first to see it here.
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SettingsIcon color="primary" />
        Review & Edit Configuration
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        multiline
        rows={18}
        value={jsonText}
        onChange={handleChange}
        variant="outlined"
        sx={{
          fontFamily: 'monospace',
          '& .MuiInputBase-input': {
            fontFamily: 'monospace',
            fontSize: '0.875rem',
          },
        }}
      />
    </Paper>
  );
}
