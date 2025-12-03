import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  CircularProgress,
  alpha,
} from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import { cvsColors } from '../theme';

const samplePrompts = [
  { label: 'Customer Service', prompt: 'Create a customer service agent that can answer questions about pharmacy services, prescription refills, and store locations. It should be helpful, empathetic, and always prioritize patient care.' },
  { label: 'Health Assistant', prompt: 'Build a health information assistant that can provide general wellness tips, medication reminders, and health screening information. Make it informative and supportive.' },
  { label: 'Appointment Scheduler', prompt: 'Create an agent that helps patients schedule MinuteClinic appointments, check availability, and send reminders. It should be efficient and user-friendly.' },
  { label: 'Benefits Guide', prompt: 'Build an agent that explains health insurance benefits, coverage options, and helps members understand their plans. It should be clear and patient.' },
];

interface RequirementInputProps {
  onGenerate: (request: string) => void;
  isLoading: boolean;
  isCompleted: boolean;
}

export default function RequirementInput({ onGenerate, isLoading, isCompleted }: RequirementInputProps) {
  const [request, setRequest] = useState('');

  const handleSubmit = () => {
    if (request.trim()) {
      onGenerate(request);
    }
  };

  const handlePromptClick = (prompt: string) => {
    setRequest(prompt);
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 3,
        position: 'relative',
        overflow: 'hidden',
        border: isCompleted ? `2px solid ${alpha(cvsColors.darkBlue, 0.3)}` : `1px solid ${alpha(cvsColors.gray[300], 0.5)}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.12)',
        },
      }}
    >
      {isCompleted && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 1,
          }}
        >
          <CheckCircleIcon sx={{ color: cvsColors.darkBlue, fontSize: 28 }} />
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${cvsColors.red} 0%, ${cvsColors.accentRed} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(204, 0, 0, 0.25)',
          }}
        >
          <AutoFixHighIcon sx={{ color: 'white', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: cvsColors.darkBlue }}>
            Describe Your Agent
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tell us what you want your AI agent to do
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <LightbulbIcon sx={{ fontSize: 18, color: cvsColors.lightBlue }} />
          <Typography variant="caption" sx={{ color: cvsColors.gray[600], fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Quick Start Templates
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {samplePrompts.map((item) => (
            <Chip
              key={item.label}
              label={item.label}
              onClick={() => handlePromptClick(item.prompt)}
              size="small"
              sx={{
                bgcolor: alpha(cvsColors.lightBlue, 0.1),
                color: cvsColors.darkBlue,
                fontWeight: 500,
                border: `1px solid ${alpha(cvsColors.lightBlue, 0.3)}`,
                '&:hover': {
                  bgcolor: alpha(cvsColors.lightBlue, 0.2),
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 8px rgba(68, 180, 231, 0.3)',
                },
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
            />
          ))}
        </Box>
      </Box>

      <TextField
        fullWidth
        multiline
        rows={6}
        value={request}
        onChange={(e) => setRequest(e.target.value)}
        placeholder="Example: Create a friendly customer service agent that can answer questions about our products, handle returns, and provide shipping information. It should be helpful, professional, and always try to resolve issues on the first contact."
        variant="outlined"
        sx={{
          mb: 3,
          '& .MuiOutlinedInput-root': {
            bgcolor: alpha(cvsColors.gray[100], 0.5),
            fontSize: '0.95rem',
            lineHeight: 1.6,
          },
        }}
      />

      <Button
        variant="contained"
        color="secondary"
        size="large"
        onClick={handleSubmit}
        disabled={isLoading || !request.trim()}
        fullWidth
        sx={{
          py: 1.5,
          fontSize: '1rem',
          fontWeight: 600,
        }}
        startIcon={
          isLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <AutoFixHighIcon />
          )
        }
      >
        {isLoading ? 'Generating Configuration...' : 'Generate Configuration'}
      </Button>
    </Paper>
  );
}
