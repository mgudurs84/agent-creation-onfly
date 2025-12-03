import json
import re
import vertexai
from vertexai.generative_models import GenerativeModel
from backend.config import get_project_config, STAGING_BUCKET
from backend.services.auth import get_credentials

PARSING_PROMPT = """You are a configuration parser for Vertex AI agents. Parse the following user request and extract a structured JSON configuration for creating an AI agent.

User Request: {user_request}

Extract the following fields and return ONLY valid JSON (no markdown, no code blocks, just pure JSON):
{{
    "agent_name": "A short, descriptive name for the agent (alphanumeric and underscores only, max 50 chars)",
    "agent_type": "One of: 'conversational', 'task-oriented', 'qa', 'creative', 'analytical'",
    "description": "A clear 1-2 sentence description of what the agent does",
    "capabilities": ["List of 3-5 specific capabilities the agent should have"],
    "tools": ["List of tools the agent might need, e.g., 'search', 'calculator', 'code_execution'"],
    "personality": "A brief description of the agent's personality and communication style",
    "instructions": "Detailed system instructions for how the agent should behave and respond"
}}

Rules:
- agent_name should be lowercase with underscores, no spaces (e.g., "customer_support_agent")
- Be specific and detailed in the instructions field
- Choose appropriate tools based on the agent's purpose
- Keep the personality consistent with the user's requirements
- Return ONLY valid JSON, nothing else"""

_initialized = False

def ensure_initialized():
    global _initialized
    if not _initialized:
        config = get_project_config()
        credentials = get_credentials()
        
        if credentials:
            vertexai.init(
                project=config["project_id"],
                location=config["location"],
                credentials=credentials,
                staging_bucket=STAGING_BUCKET
            )
        else:
            vertexai.init(
                project=config["project_id"],
                location=config["location"],
                staging_bucket=STAGING_BUCKET
            )
        _initialized = True

def parse_agent_requirements(user_request: str) -> dict:
    ensure_initialized()
    
    model = GenerativeModel("gemini-2.0-flash-exp")
    prompt = PARSING_PROMPT.format(user_request=user_request)
    response = model.generate_content(prompt)
    
    response_text = response.text.strip()
    
    if response_text.startswith("```"):
        response_text = re.sub(r'^```(?:json)?\n?', '', response_text)
        response_text = re.sub(r'\n?```$', '', response_text)
    
    config = json.loads(response_text)
    
    required_fields = ["agent_name", "agent_type", "description", "capabilities", 
                      "tools", "personality", "instructions"]
    for field in required_fields:
        if field not in config:
            raise ValueError(f"Missing required field: {field}")
    
    return config
