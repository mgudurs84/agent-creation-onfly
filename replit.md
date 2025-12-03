# Vertex AI Agent Builder

## Overview
A React + FastAPI application with CVS Health branding that creates and deploys Vertex AI agents from natural language descriptions. Users describe their agent requirements in plain text, and the application parses, configures, and deploys a working AI agent with a REST API endpoint.

## Current State
- **Status**: MVP Complete
- **Last Updated**: December 2024
- **Frontend**: React + Material UI + TypeScript + Vite
- **Backend**: FastAPI + Python
- **Theme**: CVS Health corporate branding

## CVS Health Brand Identity
- **Primary Red**: #CC0000 (CTAs, primary actions)
- **Dark Blue**: #17447C (headers, navigation)
- **Light Blue**: #44B4E7 (accents, highlights)
- **Design**: Professional healthcare aesthetic with gradient backgrounds

## Features
1. **4-Step Workflow**: Describe → Configure → Deploy → Test with visual stepper
2. **Intent Parsing**: Uses Gemini 2.0 Flash to parse requirements into structured JSON
3. **Configuration Editor**: Interactive JSON editor with syntax highlighting
4. **Agent Deployment**: Vertex AI Reasoning Engine with LangChain integration
5. **Agent Testing**: Chat interface to test deployed agents
6. **Quick-Start Templates**: Pre-built sample prompts for common agent types

## Configuration

### Required Secrets
- `GOOGLE_APPLICATION_CREDENTIALS_JSON`: Service account JSON with Vertex AI permissions

### Optional Environment Variables
- `VERTEX_AI_PROJECT_ID`: Override default project ID (default: vertex-ai-demo-468112)
- `VERTEX_AI_LOCATION`: Override default location (default: us-central1)

### Required IAM Roles for Service Account
- Vertex AI User
- Vertex AI Service Agent
- AI Platform Admin

## Project Structure
```
/
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Main application component
│   │   ├── theme.ts             # CVS Health Material UI theme
│   │   ├── api.ts               # API client for backend
│   │   ├── types/
│   │   │   └── index.ts         # TypeScript interfaces
│   │   └── components/
│   │       ├── RequirementInput.tsx  # Step 1: Natural language input
│   │       ├── ConfigEditor.tsx      # Step 2: JSON configuration editor
│   │       ├── DeploymentPanel.tsx   # Step 3: Deployment progress
│   │       └── AgentTester.tsx       # Step 4: Chat testing interface
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/
│   └── main.py                  # FastAPI backend with all endpoints
├── pyproject.toml               # Python dependencies
└── replit.md                    # This file
```

## User Flow
1. User enters agent requirements in natural language (or clicks a quick-start chip)
2. Click "Generate Configuration" to parse with Gemini 2.0
3. Review and optionally edit the JSON configuration
4. Click "Deploy to Vertex AI" to deploy the agent
5. Wait for deployment (with real-time status updates)
6. Test the agent via the chat interface

## Parsed Configuration Fields
- `agent_name`: Identifier for the agent (lowercase with underscores)
- `agent_type`: conversational, task-oriented, qa, creative, analytical
- `description`: What the agent does
- `capabilities`: List of specific capabilities
- `tools`: Required tools (search, calculator, etc.)
- `personality`: Communication style
- `instructions`: Detailed behavior instructions

## API Endpoints

### Backend (FastAPI on port 8000)
- `POST /api/parse-requirements`: Parse natural language into agent config
- `POST /api/deploy-agent`: Start agent deployment
- `GET /api/deployment-status/{id}`: Get deployment status
- `POST /api/test-agent`: Test a deployed agent

### Frontend (Vite on port 5000)
- Serves the React application
- Proxies API requests to backend

## Running Locally
```bash
# Frontend
cd frontend && npm run dev -- --port 5000

# Backend
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

## State Management
- Uses React Query for server state
- Local state for UI flow (stepper, forms)
- Automatic state reset on configuration changes
- Deployment state invalidation on any config edit

## Dependencies

### Frontend
- react, react-dom
- @mui/material, @mui/icons-material
- @emotion/react, @emotion/styled
- @tanstack/react-query
- axios
- typescript, vite

### Backend
- fastapi, uvicorn
- google-cloud-aiplatform
- google-auth
- langchain, langchain-google-vertexai
- pydantic

## Authentication
The application uses service account credentials with proper OAuth2 scopes:
- `https://www.googleapis.com/auth/cloud-platform`
- `https://www.googleapis.com/auth/aiplatform`

## Recent Changes
- December 2024: Migrated from Streamlit to React + Material UI + FastAPI
- December 2024: Implemented CVS Health corporate branding
- December 2024: Added 4-step workflow with visual stepper
- December 2024: Built comprehensive state management with proper reset logic
- December 2024: Created quick-start template chips for common agent types
