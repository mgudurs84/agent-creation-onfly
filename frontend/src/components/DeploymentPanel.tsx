import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  alpha,
  keyframes,
} from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import { useQuery } from '@tanstack/react-query';
import { getDeploymentStatus, deployAgent } from '../services/api';
import type { AgentConfig, DeploymentResult } from '../types';
import { cvsColors } from '../theme';

interface DeploymentPanelProps {
  config: AgentConfig | null;
  onDeploymentStart: () => void;
  onDeploymentError: () => void;
  onDeploymentComplete: (result: DeploymentResult, deploymentId: string) => void;
  isActive: boolean;
}

const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

const deploymentSteps = [
  { label: 'Initializing', description: 'Setting up deployment environment' },
  { label: 'Building Agent', description: 'Configuring AI model and tools' },
  { label: 'Deploying', description: 'Deploying to Google Cloud' },
  { label: 'Validating', description: 'Testing endpoint connectivity' },
];

export default function DeploymentPanel({ config, onDeploymentStart, onDeploymentError, onDeploymentComplete, isActive }: DeploymentPanelProps) {
  const [deploymentId, setDeploymentId] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const configKey = config ? JSON.stringify(config) : null;
  
  useEffect(() => {
    setDeploymentId(null);
    setIsDeploying(false);
    setDeploymentResult(null);
    setError(null);
  }, [configKey]);

  const { data: status } = useQuery({
    queryKey: ['deploymentStatus', deploymentId],
    queryFn: () => getDeploymentStatus(deploymentId!),
    enabled: !!deploymentId && isDeploying,
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (status) {
      if (status.status === 'completed' && status.result) {
        setIsDeploying(false);
        setDeploymentResult(status.result);
        onDeploymentComplete(status.result, deploymentId!);
      } else if (status.status === 'error') {
        setIsDeploying(false);
        setError(status.error || 'Deployment failed');
        onDeploymentError();
      }
    }
  }, [status, deploymentId, onDeploymentComplete, onDeploymentError]);

  const handleDeploy = async () => {
    if (!config) return;
    
    setError(null);
    setIsDeploying(true);
    setDeploymentResult(null);
    onDeploymentStart();
    
    try {
      const id = await deployAgent(config);
      setDeploymentId(id);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to start deployment');
      setIsDeploying(false);
      onDeploymentError();
    }
  };

  const getActiveStep = (): number => {
    if (!status) return 0;
    if (status.status === 'pending') return 0;
    if (status.status === 'in_progress') {
      const elapsed = status.elapsed_seconds;
      if (elapsed < 30) return 0;
      if (elapsed < 120) return 1;
      if (elapsed < 300) return 2;
      return 3;
    }
    if (status.status === 'completed') return 4;
    return 0;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!config) {
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
            <RocketLaunchIcon sx={{ color: cvsColors.gray[500], fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: cvsColors.gray[500] }}>
              Deploy Agent
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Deploy your agent to Vertex AI
            </Typography>
          </Box>
        </Box>
        
        <Alert severity="info" sx={{ bgcolor: alpha(cvsColors.lightBlue, 0.1) }}>
          Complete Steps 1 and 2 first to enable deployment.
        </Alert>
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            background: deploymentResult 
              ? `linear-gradient(135deg, #10B981 0%, #059669 100%)`
              : `linear-gradient(135deg, ${cvsColors.red} 0%, ${cvsColors.accentRed} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: deploymentResult 
              ? '0 4px 14px rgba(16, 185, 129, 0.3)'
              : '0 4px 14px rgba(204, 0, 0, 0.25)',
            animation: isDeploying ? `${pulse} 2s ease-in-out infinite` : 'none',
          }}
        >
          {deploymentResult ? (
            <CloudDoneIcon sx={{ color: 'white', fontSize: 24 }} />
          ) : (
            <RocketLaunchIcon sx={{ color: 'white', fontSize: 24 }} />
          )}
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: cvsColors.darkBlue }}>
            {deploymentResult ? 'Deployment Complete' : 'Deploy Agent'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {deploymentResult ? 'Your agent is live and ready' : 'Deploy your agent to Vertex AI'}
          </Typography>
        </Box>
      </Box>

      {!isDeploying && !deploymentResult && (
        <Button
          variant="contained"
          color="secondary"
          size="large"
          onClick={handleDeploy}
          startIcon={<CloudUploadIcon />}
          fullWidth
          sx={{ 
            py: 1.5, 
            fontSize: '1rem',
            fontWeight: 600,
          }}
        >
          Deploy to Vertex AI
        </Button>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} icon={<ErrorIcon />}>
          {error}
        </Alert>
      )}

      {isDeploying && (
        <Box>
          <Box sx={{ mb: 3 }}>
            {deploymentSteps.map((step, index) => {
              const activeStep = getActiveStep();
              const isCompleted = index < activeStep;
              const isCurrent = index === activeStep;
              
              return (
                <Box 
                  key={step.label}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2, 
                    py: 1.5,
                    opacity: isCompleted || isCurrent ? 1 : 0.4,
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: isCompleted 
                        ? '#10B981' 
                        : isCurrent 
                          ? cvsColors.red 
                          : cvsColors.gray[300],
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {isCompleted ? (
                      <CheckCircleIcon sx={{ color: 'white', fontSize: 18 }} />
                    ) : isCurrent ? (
                      <CircularProgress size={16} sx={{ color: 'white' }} />
                    ) : (
                      <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
                        {index + 1}
                      </Typography>
                    )}
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: cvsColors.darkBlue }}>
                      {step.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {step.description}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
          
          <LinearProgress 
            sx={{ 
              mb: 2, 
              height: 6, 
              borderRadius: 3,
              bgcolor: alpha(cvsColors.red, 0.1),
              '& .MuiLinearProgress-bar': {
                bgcolor: cvsColors.red,
                borderRadius: 3,
              },
            }} 
          />
          
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            Elapsed: {status ? formatTime(status.elapsed_seconds) : '0m 0s'} • This typically takes 5-10 minutes
          </Typography>
        </Box>
      )}

      {deploymentResult && (
        <Box>
          <Alert 
            severity="success" 
            sx={{ 
              mb: 3, 
              bgcolor: alpha('#10B981', 0.1),
              '& .MuiAlert-icon': { color: '#10B981' },
            }} 
            icon={<CheckCircleIcon />}
          >
            Agent deployed successfully and endpoint validated!
          </Alert>

          <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
            <Chip 
              label={deploymentResult.deployment_type === 'reasoning_engine' ? 'Reasoning Engine' : 'Gemini API'}
              size="small"
              sx={{
                bgcolor: alpha(cvsColors.darkBlue, 0.1),
                color: cvsColors.darkBlue,
                fontWeight: 500,
              }}
            />
            {deploymentResult.endpoint_validated && (
              <Chip 
                icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                label="Endpoint Validated" 
                size="small"
                sx={{
                  bgcolor: alpha('#10B981', 0.1),
                  color: '#059669',
                  fontWeight: 500,
                }}
              />
            )}
          </Box>

          {deploymentResult.endpoint_url && (
            <Accordion 
              sx={{ 
                mb: 1, 
                boxShadow: 'none', 
                border: `1px solid ${alpha(cvsColors.gray[300], 0.5)}`,
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="body2" fontWeight={500}>API Endpoint</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ 
                  bgcolor: alpha(cvsColors.gray[100], 0.5), 
                  p: 2, 
                  borderRadius: 2,
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  wordBreak: 'break-all',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 2,
                }}>
                  <code>{deploymentResult.endpoint_url}</code>
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={() => copyToClipboard(deploymentResult.endpoint_url!)}
                    startIcon={<ContentCopyIcon sx={{ fontSize: 14 }} />}
                    sx={{ flexShrink: 0 }}
                  >
                    Copy
                  </Button>
                </Box>
              </AccordionDetails>
            </Accordion>
          )}

          {deploymentResult.resource_name && (
            <Accordion 
              sx={{ 
                mb: 1, 
                boxShadow: 'none', 
                border: `1px solid ${alpha(cvsColors.gray[300], 0.5)}`,
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="body2" fontWeight={500}>Resource Name</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ 
                  bgcolor: alpha(cvsColors.gray[100], 0.5), 
                  p: 2, 
                  borderRadius: 2,
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  wordBreak: 'break-all',
                }}>
                  <code>{deploymentResult.resource_name}</code>
                </Box>
              </AccordionDetails>
            </Accordion>
          )}
        </Box>
      )}
    </Paper>
  );
}
