import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Avatar,
  alpha,
  IconButton,
  keyframes,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import { useMutation } from '@tanstack/react-query';
import { testAgent } from '../services/api';
import type { DeploymentResult } from '../types';
import { cvsColors } from '../theme';

interface Message {
  role: 'user' | 'agent';
  content: string;
}

interface AgentTesterProps {
  deploymentResult: DeploymentResult | null;
  deploymentId: string | null;
  isActive: boolean;
}

const typing = keyframes`
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
`;

export default function AgentTester({ deploymentResult, deploymentId, isActive }: AgentTesterProps) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      <Paper 
        elevation={2} 
        sx={{ 
          p: 3,
          border: `1px solid ${alpha(cvsColors.gray[300], 0.5)}`,
          opacity: 0.7,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              background: alpha(cvsColors.gray[400], 0.3),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChatIcon sx={{ color: cvsColors.gray[500], fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: cvsColors.gray[500] }}>
              Test Your Agent
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Chat with your deployed agent
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
          <QuestionAnswerIcon sx={{ fontSize: 48, color: cvsColors.gray[400], mb: 2 }} />
          <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
            Chat interface will appear here
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Deploy your agent first to start testing
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
        border: isActive ? `2px solid ${alpha(cvsColors.lightBlue, 0.5)}` : `1px solid ${alpha(cvsColors.gray[300], 0.5)}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.12)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${cvsColors.lightBlue} 0%, ${cvsColors.darkBlue} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(68, 180, 231, 0.3)',
          }}
        >
          <ChatIcon sx={{ color: 'white', fontSize: 24 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: cvsColors.darkBlue }}>
            Test Your Agent
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {deploymentResult.display_name || 'Your AI Agent'}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          height: 320,
          overflow: 'auto',
          mb: 2,
          bgcolor: alpha(cvsColors.gray[100], 0.3),
          borderRadius: 3,
          border: `1px solid ${alpha(cvsColors.gray[300], 0.5)}`,
        }}
      >
        {messages.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              p: 3,
            }}
          >
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: alpha(cvsColors.darkBlue, 0.1),
                mb: 2,
              }}
            >
              <SmartToyIcon sx={{ fontSize: 32, color: cvsColors.darkBlue }} />
            </Avatar>
            <Typography color="text.secondary" sx={{ fontWeight: 500, textAlign: 'center' }}>
              Start a conversation
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
              Type a message below to chat with your agent
            </Typography>
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
            {messages.map((msg, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    maxWidth: '85%',
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  }}
                >
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: msg.role === 'user' ? cvsColors.gray[400] : cvsColors.darkBlue,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                  >
                    {msg.role === 'user' ? (
                      <PersonIcon sx={{ fontSize: 20 }} />
                    ) : (
                      <SmartToyIcon sx={{ fontSize: 20 }} />
                    )}
                  </Avatar>
                  <Box
                    sx={{
                      bgcolor: msg.role === 'user' ? cvsColors.darkBlue : 'white',
                      color: msg.role === 'user' ? 'white' : 'text.primary',
                      py: 1.5,
                      px: 2,
                      borderRadius: 3,
                      borderTopLeftRadius: msg.role === 'agent' ? 4 : 16,
                      borderTopRightRadius: msg.role === 'user' ? 4 : 16,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      {msg.content}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
            
            {testMutation.isPending && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: cvsColors.darkBlue,
                  }}
                >
                  <SmartToyIcon sx={{ fontSize: 20 }} />
                </Avatar>
                <Box
                  sx={{
                    bgcolor: 'white',
                    py: 2,
                    px: 2.5,
                    borderRadius: 3,
                    borderTopLeftRadius: 4,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    display: 'flex',
                    gap: 0.5,
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <Box
                      key={i}
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: cvsColors.darkBlue,
                        animation: `${typing} 1.4s ease-in-out infinite`,
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
        <TextField
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          size="small"
          disabled={testMutation.isPending}
          multiline
          maxRows={3}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              bgcolor: 'white',
            },
          }}
        />
        <IconButton
          onClick={handleSend}
          disabled={testMutation.isPending || !query.trim()}
          sx={{
            width: 48,
            height: 48,
            bgcolor: cvsColors.red,
            color: 'white',
            '&:hover': {
              bgcolor: cvsColors.accentRed,
            },
            '&:disabled': {
              bgcolor: cvsColors.gray[300],
              color: cvsColors.gray[500],
            },
            boxShadow: '0 4px 12px rgba(204, 0, 0, 0.3)',
          }}
        >
          {testMutation.isPending ? (
            <CircularProgress size={20} sx={{ color: 'white' }} />
          ) : (
            <SendIcon />
          )}
        </IconButton>
      </Box>
    </Paper>
  );
}
