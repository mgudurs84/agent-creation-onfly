import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Chip,
  Paper,
  Stack,
  CircularProgress,
} from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { useQuery } from '@tanstack/react-query';
import { getSamplePrompts } from '../services/api';

interface RequirementInputProps {
  onGenerate: (request: string) => void;
  isLoading: boolean;
}

export default function RequirementInput({ onGenerate, isLoading }: RequirementInputProps) {
  const [request, setRequest] = useState('');

  const { data: samplePrompts } = useQuery({
    queryKey: ['samplePrompts'],
    queryFn: getSamplePrompts,
  });

  const handleSubmit = () => {
    if (request.trim()) {
      onGenerate(request);
    }
  };

  const handleChipClick = (prompt: string) => {
    setRequest(prompt);
  };

  return (
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
        placeholder="Describe what kind of agent you want to create...

Example: Create a customer support agent that can check order status and answer product questions. Make it helpful and professional."
        variant="outlined"
        sx={{ mb: 2 }}
      />

      <Button
        variant="contained"
        size="large"
        onClick={handleSubmit}
        disabled={isLoading || !request.trim()}
        startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <AutoFixHighIcon />}
        fullWidth
        sx={{ mb: 3 }}
      >
        {isLoading ? 'Generating...' : 'Generate Configuration'}
      </Button>

      {samplePrompts && samplePrompts.length > 0 && (
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Sample Prompts (click to use):
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {samplePrompts.map((prompt, index) => (
              <Chip
                key={index}
                label={prompt.slice(0, 50) + '...'}
                onClick={() => handleChipClick(prompt)}
                clickable
                color="primary"
                variant="outlined"
                sx={{ mb: 1 }}
              />
            ))}
          </Stack>
        </Box>
      )}
    </Paper>
  );
}
