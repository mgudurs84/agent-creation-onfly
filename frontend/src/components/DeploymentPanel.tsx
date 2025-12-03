import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Alert,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
} from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useQuery } from '@tanstack/react-query';
import { getDeploymentStatus, deployAgent } from '../services/api';
import { AgentConfig, DeploymentStatus, DeploymentResult } from '../types';

interface DeploymentPanelProps {
  config: AgentConfig | null;
  onDeploymentComplete: (result: DeploymentResult, deploymentId: string) => void;
}

const steps = ['Initialize', 'Build Agent', 'Deploy to Cloud', 'Validate Endpoint'];

export default function DeploymentPanel({ config, onDeploymentComplete }: DeploymentPanelProps) {
  const [deploymentId, setDeploymentId] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      }
    }
  }, [status, deploymentId, onDeploymentComplete]);

  const handleDeploy = async () => {
    if (!config) return;
    
    setError(null);
    setIsDeploying(true);
    setDeploymentResult(null);
    
    try {
      const id = await deployAgent(config);
      setDeploymentId(id);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to start deployment');
      setIsDeploying(false);
    }
  };

  const getActiveStep = (): number => {
    if (!status) return 0;
    if (status.status === 'pending') return 0;
    if (status.status === 'in_progress') {
      const elapsed = status.elapsed_seconds;
      if (elapsed < 30) return 1;
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
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RocketLaunchIcon color="primary" />
          Deploy Agent
        </Typography>
        <Alert severity="info">
          Generate and configure your agent first before deploying.
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <RocketLaunchIcon color="primary" />
        Deploy Agent
      </Typography>

      {!isDeploying && !deploymentResult && (
        <Button
          variant="contained"
          size="large"
          onClick={handleDeploy}
          startIcon={<RocketLaunchIcon />}
          fullWidth
          sx={{ mb: 2 }}
        >
          Create & Deploy Agent
        </Button>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} icon={<ErrorIcon />}>
          {error}
        </Alert>
      )}

      {isDeploying && status && (
        <Box sx={{ mb: 3 }}>
          <Stepper activeStep={getActiveStep()} alternativeLabel sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <CircularProgress size={24} />
            <Typography>
              Deployment in progress... ({formatTime(status.elapsed_seconds)})
            </Typography>
          </Box>
          
          <LinearProgress sx={{ mb: 1 }} />
          <Typography variant="caption" color="text.secondary">
            This typically takes 5-10 minutes. Building agent in Google Cloud...
          </Typography>
        </Box>
      )}

      {deploymentResult && (
        <Box>
          <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircleIcon />}>
            Agent deployed successfully!
          </Alert>

          <Box sx={{ mb: 2 }}>
            <Chip 
              label={deploymentResult.deployment_type === 'reasoning_engine' ? 'Reasoning Engine' : 'Gemini API'}
              color="primary"
              size="small"
              sx={{ mr: 1 }}
            />
            {deploymentResult.endpoint_validated && (
              <Chip label="Endpoint Validated" color="success" size="small" />
            )}
          </Box>

          <Typography variant="subtitle2" gutterBottom>Display Name</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>{deploymentResult.display_name}</Typography>

          <Typography variant="subtitle2" gutterBottom>Description</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>{deploymentResult.description}</Typography>

          {deploymentResult.endpoint_url && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>API Endpoint</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ 
                  bgcolor: 'grey.100', 
                  p: 2, 
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  wordBreak: 'break-all',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}>
                  <code>{deploymentResult.endpoint_url}</code>
                  <Button 
                    size="small" 
                    onClick={() => copyToClipboard(deploymentResult.endpoint_url!)}
                    startIcon={<ContentCopyIcon />}
                  >
                    Copy
                  </Button>
                </Box>
              </AccordionDetails>
            </Accordion>
          )}

          {deploymentResult.resource_name && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Resource Name</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ 
                  bgcolor: 'grey.100', 
                  p: 2, 
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  wordBreak: 'break-all',
                }}>
                  <code>{deploymentResult.resource_name}</code>
                </Box>
              </AccordionDetails>
            </Accordion>
          )}

          {deploymentResult.agent_code && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Generated Agent Code</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ 
                  bgcolor: 'grey.900', 
                  color: 'grey.100',
                  p: 2, 
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  maxHeight: 300,
                }}>
                  <pre style={{ margin: 0 }}>{deploymentResult.agent_code}</pre>
                </Box>
              </AccordionDetails>
            </Accordion>
          )}
        </Box>
      )}
    </Paper>
  );
}
