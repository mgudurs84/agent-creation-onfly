# CDR Agent Builder

## Overview
A React + FastAPI application with CVS Health branding that creates and deploys AI agents from natural language descriptions. Users describe their agent requirements in plain text, and the application parses, configures, and deploys a working AI agent.

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
- **Design**: Clean white background with professional healthcare aesthetic

---

## Local Development Setup

### Prerequisites
- Node.js 18+ (for frontend)
- Python 3.11+ (for backend)
- Google Cloud service account with Vertex AI permissions

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd <project-folder>

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies (from project root)
cd ..
pip install -r requirements.txt
# Or using uv:
uv sync
```

### Step 2: Configure Secrets

#### Option A: Environment Variables (Recommended for Local Development)

Create a `.env` file in the project root:

```bash
# .env file
GOOGLE_APPLICATION_CREDENTIALS_JSON='<paste-your-service-account-json-here>'
VERTEX_AI_PROJECT_ID=your-gcp-project-id
VERTEX_AI_LOCATION=us-central1
```

**Important**: The `GOOGLE_APPLICATION_CREDENTIALS_JSON` should contain the entire JSON content of your service account key file, wrapped in single quotes.

#### Option B: Service Account Key File

1. Download your service account JSON key from Google Cloud Console
2. Set the environment variable:

```bash
# Linux/Mac
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/your-service-account.json

# Windows PowerShell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\your-service-account.json"

# Windows CMD
set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\your-service-account.json
```

### Step 3: Create Service Account (if you don't have one)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **IAM & Admin > Service Accounts**
3. Click **Create Service Account**
4. Name it (e.g., `vertex-ai-agent-builder`)
5. Grant these roles:
   - `Vertex AI User`
   - `Vertex AI Service Agent`
   - `AI Platform Admin`
6. Click **Create Key** > **JSON** > Download

### Step 4: Run the Application

Open two terminal windows:

**Terminal 1 - Backend API (port 8000):**
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 - Frontend (port 5000):**
```bash
cd frontend
npm run dev -- --host 0.0.0.0 --port 5000
```

### Step 5: Access the Application

Open your browser to: `http://localhost:5000`

---

## Project Structure
```
/
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Main application component
│   │   ├── theme.ts             # CVS Health Material UI theme
│   │   ├── services/
│   │   │   └── api.ts           # API client for backend
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

## Features
1. **4-Step Workflow**: Describe → Configure → Deploy → Test with visual stepper
2. **Intent Parsing**: Uses Gemini 2.0 Flash to parse requirements into structured JSON
3. **Configuration Editor**: Interactive JSON editor with syntax highlighting
4. **Agent Deployment**: Vertex AI Reasoning Engine with LangChain integration
5. **Agent Testing**: Chat interface to test deployed agents
6. **Quick-Start Templates**: Pre-built sample prompts for common agent types

## User Flow
1. User enters agent requirements in natural language (or clicks a quick-start chip)
2. Click "Generate Configuration" to parse with Gemini 2.0
3. Review and optionally edit the JSON configuration
4. Click "Deploy to Vertex AI" to deploy the agent
5. Wait for deployment (with real-time status updates)
6. Test the agent via the chat interface

## API Endpoints

### Backend (FastAPI on port 8000)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check and credentials status |
| `/api/parse-requirements` | POST | Parse natural language into agent config |
| `/api/deploy-agent` | POST | Start agent deployment |
| `/api/deployment-status/{id}` | GET | Get deployment status |
| `/api/test-agent` | POST | Test a deployed agent |

## Configuration Fields
- `agent_name`: Identifier for the agent (lowercase with underscores)
- `agent_type`: conversational, task-oriented, qa, creative, analytical
- `description`: What the agent does
- `capabilities`: List of specific capabilities
- `tools`: Required tools (search, calculator, etc.)
- `personality`: Communication style
- `instructions`: Detailed behavior instructions

## Troubleshooting

### "Failed to connect to backend API"
- Ensure the backend is running on port 8000
- Check that the frontend proxy is configured correctly in `vite.config.ts`

### "Google Cloud credentials not configured"
- Verify your `GOOGLE_APPLICATION_CREDENTIALS_JSON` secret is set
- Ensure the service account has the required IAM roles

### Deployment takes too long
- Vertex AI Reasoning Engine deployments can take 5-10 minutes
- Check the Google Cloud Console for deployment status

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

## Recent Changes
- December 2024: Renamed to CDR Agent Builder
- December 2024: Clean white background UI update
- December 2024: Migrated from Streamlit to React + Material UI + FastAPI
- December 2024: Implemented CVS Health corporate branding
- December 2024: Added 4-step workflow with visual stepper
