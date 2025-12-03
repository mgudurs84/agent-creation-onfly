import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  List,
  ListItem,
  Avatar,
  Divider,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import { useMutation } from '@tanstack/react-query';
import { testAgent } from '../services/api';
import { DeploymentResult } from '../types';

interface Message {
  role: 'user' | 'agent';
  content: string;
}

interface AgentTesterProps {
  deploymentResult: DeploymentResult | null;
  deploymentId: string | null;
}

export default function AgentTester({ deploymentResult, deploymentId }: AgentTesterProps) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  const testMutation = useMutation({
    mutationFn: (q: string) => testAgent(deploymentId!, q),
    onSuccess: (response) => {
      setMessages((prev) => [...prev, { role: 'agent', content: response }]);
    },
    onError: (error: any) => {
      setMessages((prev) => [
        ...prev,
        { role: 'agent', content: `Error: ${error.response?.data?.detail || error.message}` },
      ]);
    },
  });

  const handleSend = () => {
    if (!query.trim() || !deploymentId) return;
    
    setMessages((prev) => [...prev, { role: 'user', content: query }]);
    testMutation.mutate(query);
    setQuery('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!deploymentResult || !deploymentId) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ChatIcon color="primary" />
          Test Your Agent
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 200,
            bgcolor: 'action.hover',
            borderRadius: 1,
          }}
        >
          <Typography color="text.secondary">
            Deploy an agent first to test it here.
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ChatIcon color="primary" />
        Test Your Agent
      </Typography>
      
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Testing via: {deploymentResult.deployment_type} endpoint
      </Typography>

      <Box
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          height: 300,
          overflow: 'auto',
          mb: 2,
          bgcolor: 'grey.50',
        }}
      >
        {messages.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <Typography color="text.secondary">
              Send a message to start chatting with your agent.
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {messages.map((msg, index) => (
              <Box key={index}>
                <ListItem
                  sx={{
                    flexDirection: 'column',
                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    py: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, maxWidth: '85%' }}>
                    {msg.role === 'agent' && (
                      <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                        <SmartToyIcon fontSize="small" />
                      </Avatar>
                    )}
                    <Box
                      sx={{
                        bgcolor: msg.role === 'user' ? 'primary.main' : 'white',
                        color: msg.role === 'user' ? 'white' : 'text.primary',
                        p: 2,
                        borderRadius: 2,
                        boxShadow: 1,
                      }}
                    >
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {msg.content}
                      </Typography>
                    </Box>
                    {msg.role === 'user' && (
                      <Avatar sx={{ bgcolor: 'grey.400', width: 32, height: 32 }}>
                        <PersonIcon fontSize="small" />
                      </Avatar>
                    )}
                  </Box>
                </ListItem>
                {index < messages.length - 1 && <Divider />}
              </Box>
            ))}
            {testMutation.isPending && (
              <ListItem sx={{ justifyContent: 'flex-start' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                    <SmartToyIcon fontSize="small" />
                  </Avatar>
                  <CircularProgress size={20} />
                </Box>
              </ListItem>
            )}
          </List>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask your agent a question..."
          size="small"
          disabled={testMutation.isPending}
        />
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={testMutation.isPending || !query.trim()}
          endIcon={testMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
        >
          Send
        </Button>
      </Box>
    </Paper>
  );
}
