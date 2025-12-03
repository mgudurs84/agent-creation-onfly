import os

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

def get_project_config():
    return {
        "project_id": os.environ.get("VERTEX_AI_PROJECT_ID", DEFAULT_PROJECT_ID),
        "location": os.environ.get("VERTEX_AI_LOCATION", DEFAULT_LOCATION),
    }
