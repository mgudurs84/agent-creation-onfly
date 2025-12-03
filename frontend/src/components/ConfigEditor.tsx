import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Alert,
  alpha,
  Chip,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import CodeIcon from '@mui/icons-material/Code';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import type { AgentConfig } from '../types';
import { cvsColors } from '../theme';

interface ConfigEditorProps {
  config: AgentConfig | null;
  onConfigChange: (config: AgentConfig) => void;
  isActive: boolean;
}

export default function ConfigEditor({ config, onConfigChange, isActive }: ConfigEditorProps) {
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
      <Paper 
        elevation={2} 
        sx={{ 
          p: 3, 
          height: '100%', 
          minHeight: 400,
          border: `1px solid ${alpha(cvsColors.gray[300], 0.5)}`,
          transition: 'all 0.3s ease',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${cvsColors.darkBlue} 0%, ${alpha(cvsColors.darkBlue, 0.8)} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SettingsIcon sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: cvsColors.darkBlue }}>
              Agent Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review and customize your agent settings
            </Typography>
          </Box>
        </Box>
        
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: 280,
            bgcolor: alpha(cvsColors.gray[100], 0.5),
            borderRadius: 3,
            border: `2px dashed ${alpha(cvsColors.gray[400], 0.3)}`,
          }}
        >
          <CodeIcon sx={{ fontSize: 48, color: cvsColors.gray[400], mb: 2 }} />
          <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
            Configuration will appear here
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Generate a configuration from Step 1 first
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 3,
        border: isActive ? `2px solid ${alpha(cvsColors.red, 0.3)}` : `1px solid ${alpha(cvsColors.gray[300], 0.5)}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.12)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${cvsColors.darkBlue} 0%, ${cvsColors.lightBlue} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(23, 68, 124, 0.25)',
            }}
          >
            <SettingsIcon sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: cvsColors.darkBlue }}>
              Agent Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review and customize settings
            </Typography>
          </Box>
        </Box>
        
        <Chip
          icon={<CheckCircleOutlineIcon sx={{ fontSize: 16 }} />}
          label="Ready to Deploy"
          size="small"
          sx={{
            bgcolor: alpha('#10B981', 0.1),
            color: '#059669',
            fontWeight: 500,
            border: `1px solid ${alpha('#10B981', 0.3)}`,
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" sx={{ color: cvsColors.gray[600], fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Agent: {config.agent_name}
        </Typography>
      </Box>

      <TextField
        fullWidth
        multiline
        rows={14}
        value={jsonText}
        onChange={handleChange}
        variant="outlined"
        sx={{
          '& .MuiOutlinedInput-root': {
            fontFamily: '"Fira Code", "Monaco", "Consolas", monospace',
            fontSize: '0.85rem',
            lineHeight: 1.6,
            bgcolor: alpha(cvsColors.gray[900], 0.02),
            '& .MuiInputBase-input': {
              fontFamily: '"Fira Code", "Monaco", "Consolas", monospace',
            },
          },
        }}
      />
    </Paper>
  );
}
