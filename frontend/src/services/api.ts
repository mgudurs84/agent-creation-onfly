import axios from 'axios';
import type { AgentConfig, DeploymentStatus, HealthStatus } from '../types';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const healthCheck = async (): Promise<HealthStatus> => {
  const response = await api.get('/health');
  return response.data;
};

export const getSamplePrompts = async (): Promise<string[]> => {
  const response = await api.get('/sample-prompts');
  return response.data.prompts;
};

export const parseRequirements = async (userRequest: string): Promise<AgentConfig> => {
  const response = await api.post('/parse', { user_request: userRequest });
  return response.data.config;
};

export const deployAgent = async (config: AgentConfig): Promise<string> => {
  const response = await api.post('/deploy', { config });
  return response.data.deployment_id;
};

export const getDeploymentStatus = async (deploymentId: string): Promise<DeploymentStatus> => {
  const response = await api.get(`/status/${deploymentId}`);
  return response.data;
};

export const testAgent = async (deploymentId: string, query: string): Promise<string> => {
  const response = await api.post('/test', { deployment_id: deploymentId, query });
  return response.data.response;
};
