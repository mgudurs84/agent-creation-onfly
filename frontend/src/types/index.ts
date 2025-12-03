export interface AgentConfig {
  agent_name: string;
  agent_type: string;
  description: string;
  capabilities: string[];
  tools: string[];
  personality: string;
  instructions: string;
}

export interface DeploymentResult {
  resource_name?: string;
  endpoint_url?: string;
  display_name?: string;
  description?: string;
  agent_code?: string;
  deployment_type?: string;
  config?: AgentConfig;
  endpoint_validated?: boolean;
  system_message?: string;
}

export interface DeploymentStatus {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  elapsed_seconds: number;
  result?: DeploymentResult;
  error?: string;
}

export interface HealthStatus {
  status: string;
  has_credentials: boolean;
  project_id: string;
  location: string;
}
