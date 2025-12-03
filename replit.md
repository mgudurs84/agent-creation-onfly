# Vertex AI Agent Builder

## Overview
A Streamlit application that creates and deploys Vertex AI agents from natural language descriptions. Users describe their agent requirements in plain text, and the application parses, configures, and deploys a working AI agent with a REST API endpoint.

## Current State
- **Status**: MVP Complete
- **Last Updated**: December 2024
- **Framework**: Streamlit + Google Cloud Vertex AI + LangChain

## Features
1. **Text Input Interface**: Simple text area for describing agent requirements with sample prompts
2. **Intent Parsing**: Uses Gemini 2.0 Flash (gemini-2.0-flash-exp) to parse requirements into structured JSON
3. **Configuration Editor**: Interactive JSON editor for reviewing and modifying agent configuration
4. **Dual Deployment Options**:
   - Primary: Vertex AI Reasoning Engine with LangChain (fully-qualified model resource)
   - Fallback: Vertex AI Agent Builder with system instructions
5. **Agent Testing**: Test deployed agents via their actual endpoints with proper authentication
6. **Configurable Project Settings**: Project ID and location configurable via environment variables

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
├── app.py                    # Main Streamlit application
├── .streamlit/
│   └── config.toml          # Streamlit configuration
├── pyproject.toml           # Python dependencies
└── replit.md                # This file
```

## User Flow
1. User enters agent requirements in natural language
2. Click "Generate Configuration" to parse with Gemini 2.0
3. Review and optionally edit the JSON configuration
4. Click "Create & Deploy Agent" to deploy to Vertex AI
5. Use the returned endpoint URL to interact with the agent
6. Test the agent directly via the deployed endpoint

## Parsed Configuration Fields
- `agent_name`: Identifier for the agent (lowercase with underscores)
- `agent_type`: conversational, task-oriented, qa, creative, analytical
- `description`: What the agent does
- `capabilities`: List of specific capabilities
- `tools`: Required tools (search, calculator, etc.)
- `personality`: Communication style
- `instructions`: Detailed behavior instructions

## Deployment Types

### Reasoning Engine (Primary)
- Uses Vertex AI Reasoning Engine with LangChain
- Uses fully-qualified model resource path
- Creates a dedicated agent resource in Vertex AI
- Provides a unique resource name and endpoint URL
- Takes 5-10 minutes to deploy

### Vertex AI Agent (Fallback)
- Uses Vertex AI with system instructions
- Faster deployment
- Uses the Gemini generateContent endpoint with embedded system instruction
- Agent configuration stored in session and metadata

## Running Locally
```bash
streamlit run app.py --server.port 5000
```

## Dependencies
- streamlit
- google-cloud-aiplatform
- google-auth
- google-oauth2
- langchain
- langchain-google-vertexai
- requests

## Authentication
The application uses service account credentials with proper OAuth2 scopes:
- `https://www.googleapis.com/auth/cloud-platform`
- `https://www.googleapis.com/auth/aiplatform`

## Testing Deployed Agents
The test interface calls the actual deployed endpoint:
- For Reasoning Engine: Uses the `remote_agent.query()` method or resource lookup
- For Vertex AI Agent: Makes authenticated HTTP requests to the Vertex AI API with system instruction
- Fallback: Uses local Gemini model with same system instruction for consistency

## API Usage Example
After deployment, you can use curl to call your agent:
```bash
curl -X POST \
  "https://us-central1-aiplatform.googleapis.com/v1/projects/YOUR_PROJECT/locations/us-central1/publishers/google/models/gemini-2.0-flash-exp:generateContent" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{"role": "user", "parts": [{"text": "YOUR_QUERY"}]}],
    "systemInstruction": {"parts": [{"text": "YOUR_AGENT_SYSTEM_INSTRUCTION"}]},
    "generationConfig": {"temperature": 0.7, "maxOutputTokens": 2048}
  }'
```

## Recent Changes
- December 2024: Added configurable project/location via environment variables
- December 2024: Implemented proper Reasoning Engine deployment with fully-qualified model resource
- December 2024: Fixed credential scoping for API authentication
- December 2024: Added endpoint-based testing with proper fallback chain
- December 2024: Added API usage example in deployment details
