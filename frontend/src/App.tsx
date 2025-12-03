import { useState } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  stepConnectorClasses,
  styled,
  alpha,
  Alert,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import EditNoteIcon from '@mui/icons-material/EditNote';
import SettingsIcon from '@mui/icons-material/Settings';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import ChatIcon from '@mui/icons-material/Chat';
import { QueryClient, QueryClientProvider, useQuery, useMutation } from '@tanstack/react-query';
import { theme, cvsColors } from './theme';
import type { AgentConfig, DeploymentResult } from './types';
import { parseRequirements, healthCheck } from './services/api';
import RequirementInput from './components/RequirementInput';
import ConfigEditor from './components/ConfigEditor';
import DeploymentPanel from './components/DeploymentPanel';
import AgentTester from './components/AgentTester';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const steps = [
  { label: 'Describe', icon: EditNoteIcon, description: 'Tell us about your agent' },
  { label: 'Configure', icon: SettingsIcon, description: 'Review the configuration' },
  { label: 'Deploy', icon: RocketLaunchIcon, description: 'Deploy to Vertex AI' },
  { label: 'Test', icon: ChatIcon, description: 'Try your agent' },
];

const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: `linear-gradient(95deg, ${cvsColors.darkBlue} 0%, ${cvsColors.lightBlue} 100%)`,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: `linear-gradient(95deg, ${cvsColors.darkBlue} 0%, ${cvsColors.lightBlue} 100%)`,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: theme.palette.grey[300],
    borderRadius: 1,
  },
}));

const ColorlibStepIconRoot = styled('div')<{
  ownerState: { completed?: boolean; active?: boolean };
}>(({ theme, ownerState }) => ({
  backgroundColor: theme.palette.grey[300],
  zIndex: 1,
  color: '#fff',
  width: 50,
  height: 50,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  transition: 'all 0.3s ease',
  ...(ownerState.active && {
    backgroundImage: `linear-gradient(135deg, ${cvsColors.red} 0%, ${cvsColors.accentRed} 100%)`,
    boxShadow: '0 4px 20px 0 rgba(204, 0, 0, 0.4)',
  }),
  ...(ownerState.completed && {
    backgroundImage: `linear-gradient(135deg, ${cvsColors.darkBlue} 0%, ${cvsColors.lightBlue} 100%)`,
    boxShadow: '0 4px 20px 0 rgba(23, 68, 124, 0.3)',
  }),
}));

function ColorlibStepIcon(props: { active?: boolean; completed?: boolean; icon: React.ReactNode; className?: string }) {
  const { active, completed, className, icon } = props;
  const stepIndex = Number(icon) - 1;
  const StepIcon = steps[stepIndex]?.icon || EditNoteIcon;

  return (
    <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
      <StepIcon sx={{ fontSize: 24 }} />
    </ColorlibStepIconRoot>
  );
}

function AppContent() {
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null);
  const [deploymentId, setDeploymentId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  const { data: health, error: healthError } = useQuery({
    queryKey: ['health'],
    queryFn: healthCheck,
  });

  const parseMutation = useMutation({
    mutationFn: parseRequirements,
    onSuccess: (data) => {
      setConfig(data);
      setDeploymentResult(null);
      setDeploymentId(null);
      setActiveStep(1);
    },
  });

  const handleGenerate = (request: string) => {
    parseMutation.mutate(request);
  };

  const handleConfigChange = (newConfig: AgentConfig) => {
    setConfig(newConfig);
    setDeploymentResult(null);
    setDeploymentId(null);
    if (activeStep > 1) {
      setActiveStep(1);
    }
  };

  const handleDeploymentStart = () => {
    setActiveStep(2);
  };

  const handleDeploymentError = () => {
    setDeploymentResult(null);
    setDeploymentId(null);
    setActiveStep(1);
  };

  const handleDeploymentComplete = (result: DeploymentResult, id: string) => {
    setDeploymentResult(result);
    setDeploymentId(id);
    setActiveStep(3);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
          bgcolor: 'white',
          borderBottom: `1px solid ${alpha(cvsColors.gray[300], 0.5)}`,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${cvsColors.red} 0%, ${cvsColors.accentRed} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(204, 0, 0, 0.3)',
              }}
            >
              <SmartToyIcon sx={{ color: 'white', fontSize: 26 }} />
            </Box>
            <Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700, 
                  color: cvsColors.darkBlue,
                  letterSpacing: '-0.01em',
                  lineHeight: 1.2,
                }}
              >
                AI Agent Builder
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: cvsColors.gray[500],
                  fontWeight: 500,
                }}
              >
                Powered by Vertex AI
              </Typography>
            </Box>
          </Box>

          {health && (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" sx={{ color: cvsColors.gray[500], display: 'block' }}>
                  Project
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: cvsColors.darkBlue }}>
                  {health.project_id}
                </Typography>
              </Box>
              <Box 
                sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: health.has_credentials ? '#10B981' : cvsColors.red,
                  boxShadow: health.has_credentials 
                    ? '0 0 0 3px rgba(16, 185, 129, 0.2)' 
                    : '0 0 0 3px rgba(204, 0, 0, 0.2)',
                }} 
              />
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          background: `linear-gradient(180deg, ${alpha(cvsColors.darkBlue, 0.03)} 0%, transparent 100%)`,
          pt: 4,
          pb: 2,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: cvsColors.darkBlue,
                mb: 1,
                letterSpacing: '-0.02em',
              }}
            >
              Build Your AI Agent
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: cvsColors.gray[600],
                fontWeight: 400,
                maxWidth: 600,
                mx: 'auto',
              }}
            >
              Describe your requirements and deploy a custom AI agent in minutes
            </Typography>
          </Box>

          <Stepper 
            alternativeLabel 
            activeStep={activeStep} 
            connector={<ColorlibConnector />}
            sx={{ mb: 2 }}
          >
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel 
                  StepIconComponent={ColorlibStepIcon}
                  sx={{
                    '& .MuiStepLabel-label': {
                      mt: 1,
                      color: index <= activeStep ? cvsColors.darkBlue : cvsColors.gray[500],
                    },
                  }}
                >
                  <Typography variant="body2" fontWeight={index === activeStep ? 600 : 500}>
                    {step.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {step.description}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Container>
      </Box>

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

        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, 
            gap: 3,
          }}
        >
          <RequirementInput 
            onGenerate={handleGenerate} 
            isLoading={parseMutation.isPending}
            isCompleted={activeStep > 0}
          />
          
          <ConfigEditor 
            config={config} 
            onConfigChange={handleConfigChange}
            isActive={activeStep === 1}
          />

          <DeploymentPanel 
            config={config}
            onDeploymentStart={handleDeploymentStart}
            onDeploymentError={handleDeploymentError}
            onDeploymentComplete={handleDeploymentComplete}
            isActive={activeStep >= 1}
          />

          <AgentTester 
            deploymentResult={deploymentResult}
            deploymentId={deploymentId}
            isActive={activeStep === 3}
          />
        </Box>

        <Box sx={{ textAlign: 'center', mt: 6, pb: 4 }}>
          <Typography variant="body2" sx={{ color: cvsColors.gray[500] }}>
            CVS Health AI Platform • Built with React & Vertex AI
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
