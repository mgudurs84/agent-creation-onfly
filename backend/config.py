import os
import json

DEFAULT_PROJECT_ID = "vertex-ai-demo-468112"
DEFAULT_LOCATION = "us-central1"
STAGING_BUCKET = "gs://vertex-agent-staging"

VERTEX_AI_SCOPES = [
    "https://www.googleapis.com/auth/cloud-platform",
    "https://www.googleapis.com/auth/aiplatform",
]

SAMPLE_PROMPTS = [
    "Create a customer support agent that can check order status and answer product questions. Make it helpful and professional.",
    "Build a coding assistant that can explain code, debug issues, and suggest improvements. Make it patient and educational.",
    "Create a travel planning agent that can research destinations, suggest itineraries, and provide local tips. Make it enthusiastic and knowledgeable.",
    "Build a data analysis assistant that can interpret charts, explain statistics, and suggest insights. Make it precise and thorough.",
    "Create a writing helper that can proofread, suggest improvements, and help with creative writing. Make it encouraging and constructive.",
]

def _get_project_from_credentials():
    credentials_json = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    credentials_file = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    
    try:
        if credentials_json:
            creds = json.loads(credentials_json)
            return creds.get("project_id")
        elif credentials_file and os.path.exists(credentials_file):
            with open(credentials_file, 'r') as f:
                creds = json.load(f)
                return creds.get("project_id")
    except Exception:
        pass
    return None

def get_project_config():
    project_id = os.environ.get("VERTEX_AI_PROJECT_ID")
    if not project_id:
        project_id = _get_project_from_credentials()
    if not project_id:
        project_id = DEFAULT_PROJECT_ID
    
    return {
        "project_id": project_id,
        "location": os.environ.get("VERTEX_AI_LOCATION", DEFAULT_LOCATION),
    }
