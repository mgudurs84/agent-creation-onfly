import streamlit as st
import json
import os
import time
import re
import requests
from typing import Optional
from concurrent.futures import ThreadPoolExecutor, Future
import vertexai
from vertexai.generative_models import GenerativeModel
from vertexai.preview import reasoning_engines
from google.cloud import aiplatform
from google.oauth2 import service_account
from google.auth.transport.requests import Request

DEFAULT_PROJECT_ID = "vertex-ai-demo-468112"
DEFAULT_LOCATION = "us-central1"

VERTEX_AI_SCOPES = [
    "https://www.googleapis.com/auth/cloud-platform",
    "https://www.googleapis.com/auth/aiplatform",
]

def get_project_config():
    """Get project configuration from environment or defaults."""
    return {
        "project_id": os.environ.get("VERTEX_AI_PROJECT_ID", DEFAULT_PROJECT_ID),
        "location": os.environ.get("VERTEX_AI_LOCATION", DEFAULT_LOCATION),
    }

SAMPLE_PROMPTS = [
    "Create a customer support agent that can check order status and answer product questions. Make it helpful and professional.",
    "Build a coding assistant that can explain code, debug issues, and suggest improvements. Make it patient and educational.",
    "Create a travel planning agent that can research destinations, suggest itineraries, and provide local tips. Make it enthusiastic and knowledgeable.",
    "Build a data analysis assistant that can interpret charts, explain statistics, and suggest insights. Make it precise and thorough.",
    "Create a writing helper that can proofread, suggest improvements, and help with creative writing. Make it encouraging and constructive.",
]

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


def get_credentials():
    """Get Google Cloud credentials from environment."""
    credentials_json = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    
    if credentials_json:
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            f.write(credentials_json)
            credentials_path = f.name
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = credentials_path
        
        credentials_info = json.loads(credentials_json)
        credentials = service_account.Credentials.from_service_account_info(
            credentials_info,
            scopes=VERTEX_AI_SCOPES
        )
        return credentials
    return None


def init_vertex_ai():
    """Initialize Vertex AI with project and location."""
    config = get_project_config()
    credentials = get_credentials()
    staging_bucket = "gs://vertex-agent-staging"
    
    try:
        if credentials:
            vertexai.init(
                project=config["project_id"], 
                location=config["location"],
                credentials=credentials,
                staging_bucket=staging_bucket
            )
            aiplatform.init(
                project=config["project_id"], 
                location=config["location"],
                credentials=credentials,
                staging_bucket=staging_bucket
            )
        else:
            vertexai.init(
                project=config["project_id"], 
                location=config["location"],
                staging_bucket=staging_bucket
            )
            aiplatform.init(
                project=config["project_id"], 
                location=config["location"],
                staging_bucket=staging_bucket
            )
        return True
    except Exception as e:
        st.error(f"Failed to initialize Vertex AI: {str(e)}")
        return False


def get_access_token():
    """Get Google Cloud access token for API calls with proper scopes."""
    credentials_json = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    
    if not credentials_json:
        st.error("No credentials available for API access.")
        return None
    
    try:
        credentials_info = json.loads(credentials_json)
        
        from google.oauth2 import service_account as sa
        credentials = sa.Credentials.from_service_account_info(
            credentials_info,
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        
        from google.auth.transport.requests import Request as AuthRequest
        auth_req = AuthRequest()
        credentials.refresh(auth_req)
        
        if credentials.token:
            return credentials.token
            
        st.warning("Could not obtain access token from credentials")
        return None
    except Exception as e:
        st.error(f"Failed to get access token: {str(e)}")
        return None


def parse_agent_requirements(user_request: str) -> Optional[dict]:
    """Use Gemini 2.0 to parse user requirements into structured config."""
    try:
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
                st.error(f"Missing required field: {field}")
                return None
        
        return config
        
    except json.JSONDecodeError as e:
        st.error(f"Failed to parse JSON response: {str(e)}")
        st.code(response_text if 'response_text' in locals() else "No response", language="text")
        return None
    except Exception as e:
        st.error(f"Error parsing requirements: {str(e)}")
        return None


def create_agent_template(config: dict) -> str:
    """Create the agent class template based on configuration."""
    capabilities_str = ", ".join([f'"{cap}"' for cap in config.get("capabilities", [])])
    tools_str = ", ".join([f'"{tool}"' for tool in config.get("tools", [])])
    
    agent_code = f'''
class {config["agent_name"].title().replace("_", "")}Agent:
    """
    {config["description"]}
    
    Agent Type: {config["agent_type"]}
    Personality: {config["personality"]}
    
    Capabilities: [{capabilities_str}]
    Tools: [{tools_str}]
    """
    
    def __init__(self):
        self.model = "gemini-2.0-flash-exp"
        self.config = {{
            "name": "{config["agent_name"]}",
            "type": "{config["agent_type"]}",
            "description": """{config["description"]}""",
            "personality": """{config["personality"]}""",
            "instructions": """{config["instructions"]}"""
        }}
    
    def set_up(self):
        """Initialize the agent with Vertex AI model."""
        from vertexai.generative_models import GenerativeModel
        self.model_instance = GenerativeModel(self.model)
        
    def query(self, user_input: str) -> str:
        """Process a user query and return a response."""
        system_prompt = f"""{{self.config["instructions"]}}
        
Your personality: {{self.config["personality"]}}

Respond to the following user input:"""
        
        full_prompt = f"{{system_prompt}}\\n\\nUser: {{user_input}}"
        response = self.model_instance.generate_content(full_prompt)
        return response.text
'''
    return agent_code


_executor = ThreadPoolExecutor(max_workers=2)

def _deploy_reasoning_engine_worker(config: dict, system_message: str, agent_code: str) -> dict:
    """Background worker that performs the actual Agent Engine deployment.
    
    This runs in a separate thread so the UI can keep updating.
    """
    config_env = get_project_config()
    project_id = config_env["project_id"]
    location = config_env["location"]
    staging_bucket = "gs://vertex-agent-staging"
    
    print(f"[DEPLOY-WORKER] Starting deployment for agent: {config.get('agent_name', 'unknown')}", flush=True)
    
    print("[DEPLOY-WORKER] Initializing Vertex AI with staging bucket...", flush=True)
    credentials = get_credentials()
    if credentials:
        vertexai.init(
            project=project_id,
            location=location,
            credentials=credentials,
            staging_bucket=staging_bucket
        )
    else:
        vertexai.init(
            project=project_id,
            location=location,
            staging_bucket=staging_bucket
        )
    
    print("[DEPLOY-WORKER] Creating LangChain agent...", flush=True)
    langchain_agent = reasoning_engines.LangchainAgent(
        model="gemini-2.0-flash",
        model_kwargs={
            "temperature": 0.7,
            "max_output_tokens": 2048,
        },
        runnable_kwargs={
            "system_message": system_message
        }
    )
    print("[DEPLOY-WORKER] LangChain agent created, submitting to Agent Engine...", flush=True)
    
    remote_agent = reasoning_engines.ReasoningEngine.create(
        langchain_agent,
        display_name=config["agent_name"],
        description=config["description"],
        requirements=[
            "google-cloud-aiplatform[langchain,agent_engines]>=1.72.0",
            "cloudpickle==3.0.0",
            "langchain>=0.3.0,<0.4.0",
            "langchain-google-vertexai>=2.0.0,<3.0.0",
            "pydantic>=2.10",
        ],
    )
    print(f"[DEPLOY-WORKER] Deployment complete! Resource: {remote_agent.resource_name}", flush=True)
    
    resource_name = remote_agent.resource_name
    if not resource_name:
        raise ValueError("Deployment succeeded but no resource name returned")
    
    base_url = f"https://{location}-aiplatform.googleapis.com/v1beta1"
    endpoint_url = f"{base_url}/{resource_name}:query"
    
    endpoint_validated = False
    try:
        test_response = remote_agent.query(input="Hello, are you ready?")
        endpoint_validated = True
        print("[DEPLOY-WORKER] Endpoint validated successfully", flush=True)
    except Exception as test_error:
        print(f"[DEPLOY-WORKER] Endpoint warmup needed: {test_error}", flush=True)
    
    return {
        "status": "deployed",
        "resource_name": resource_name,
        "endpoint_url": endpoint_url,
        "display_name": config["agent_name"],
        "description": config["description"],
        "agent_code": agent_code,
        "deployment_type": "reasoning_engine",
        "config": config,
        "endpoint_validated": endpoint_validated,
        "system_message": system_message,
        "remote_agent": remote_agent,
    }


def start_deployment_async(config: dict) -> None:
    """Start the deployment in a background thread.
    
    Stores the Future in session_state so we can poll it.
    """
    agent_code = create_agent_template(config)
    
    system_message = f"""{config["instructions"]}

Your personality: {config["personality"]}
Agent type: {config["agent_type"]}
Description: {config["description"]}

You are a helpful AI assistant. Answer user questions thoughtfully and thoroughly."""
    
    future = _executor.submit(_deploy_reasoning_engine_worker, config, system_message, agent_code)
    
    st.session_state["deployment_future"] = future
    st.session_state["deployment_start_time"] = time.time()
    st.session_state["deployment_config"] = config
    print(f"[DEPLOY] Background deployment started for: {config.get('agent_name', 'unknown')}", flush=True)


def check_deployment_status() -> Optional[dict]:
    """Check if the background deployment is complete.
    
    Returns None if still running, or the result dict if complete.
    """
    if "deployment_future" not in st.session_state:
        return None
    
    future = st.session_state["deployment_future"]
    
    if future.done():
        try:
            result = future.result()
            if "remote_agent" in result:
                st.session_state["deployed_remote_agent"] = result.pop("remote_agent")
            del st.session_state["deployment_future"]
            del st.session_state["deployment_start_time"]
            del st.session_state["deployment_config"]
            return result
        except Exception as e:
            del st.session_state["deployment_future"]
            del st.session_state["deployment_start_time"]
            del st.session_state["deployment_config"]
            return {
                "status": "error",
                "error": str(e),
            }
    
    return None


def is_deployment_running() -> bool:
    """Check if a deployment is currently in progress."""
    return "deployment_future" in st.session_state


def get_deployment_elapsed_time() -> float:
    """Get elapsed time in seconds since deployment started."""
    if "deployment_start_time" in st.session_state:
        return time.time() - st.session_state["deployment_start_time"]
    return 0


def deploy_vertex_ai_agent(config: dict) -> dict:
    """Deploy agent using Vertex AI Gemini API with embedded system instruction.
    
    Note: This fallback creates a configured agent that uses the Gemini API
    with a custom system instruction. The agent is defined by its configuration
    and system instruction, which must be included in each API call.
    """
    config_env = get_project_config()
    project_id = config_env["project_id"]
    location = config_env["location"]
    
    try:
        agent_code = create_agent_template(config)
        timestamp = int(time.time())
        agent_id = f"{config['agent_name']}_{timestamp}"
        
        progress_bar = st.progress(0, text="Initializing Vertex AI Agent...")
        
        progress_bar.progress(20, text="Creating agent configuration...")
        
        system_instruction = f"""{config['instructions']}

Your personality: {config['personality']}
Agent type: {config['agent_type']}
Description: {config['description']}"""
        
        model = GenerativeModel(
            "gemini-2.0-flash-exp",
            system_instruction=system_instruction
        )
        
        progress_bar.progress(50, text="Validating agent configuration...")
        
        test_response = model.generate_content("Confirm you understand your role by saying 'Agent initialized and ready to serve.'")
        
        progress_bar.progress(80, text="Testing endpoint connectivity...")
        
        endpoint_url = f"https://{location}-aiplatform.googleapis.com/v1/projects/{project_id}/locations/{location}/publishers/google/models/gemini-2.0-flash-exp:generateContent"
        
        access_token = get_access_token()
        endpoint_validated = False
        
        if access_token:
            try:
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                }
                test_payload = {
                    "contents": [{"role": "user", "parts": [{"text": "Hello"}]}],
                    "systemInstruction": {"parts": [{"text": system_instruction}]},
                    "generationConfig": {"temperature": 0.7, "maxOutputTokens": 100}
                }
                test_response_api = requests.post(endpoint_url, headers=headers, json=test_payload, timeout=30)
                endpoint_validated = test_response_api.status_code == 200
            except Exception as test_error:
                st.warning(f"Endpoint validation warning: {test_error}")
        
        agent_metadata = {
            "agent_id": agent_id,
            "agent_name": config["agent_name"],
            "agent_type": config["agent_type"],
            "description": config["description"],
            "personality": config["personality"],
            "instructions": config["instructions"],
            "system_instruction": system_instruction,
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
            "project_id": project_id,
            "location": location,
        }
        
        st.session_state["agent_system_instruction"] = system_instruction
        
        progress_bar.progress(100, text="Agent configuration complete!")
        
        return {
            "status": "deployed",
            "agent_id": agent_id,
            "endpoint_url": endpoint_url,
            "display_name": config["agent_name"],
            "description": config["description"],
            "initialization_response": test_response.text,
            "agent_code": agent_code,
            "config": config,
            "deployment_type": "gemini_configured",
            "agent_metadata": agent_metadata,
            "system_instruction": system_instruction,
            "endpoint_validated": endpoint_validated,
            "note": "This agent uses the Gemini API with a custom system instruction. Include the system instruction in each API call to maintain agent behavior."
        }
            
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
        }


def deploy_reasoning_engine(config: dict) -> dict:
    """Legacy synchronous deployment - now redirects to async.
    
    This is kept for backwards compatibility but the UI should use
    start_deployment_async and check_deployment_status instead.
    """
    start_deployment_async(config)
    
    while is_deployment_running():
        time.sleep(2)
        result = check_deployment_status()
        if result:
            return result
    
    return {"status": "error", "error": "Deployment did not complete"}


def deploy_agent(config: dict) -> dict:
    """Deploy the agent to Vertex AI and return endpoint info.
    
    Note: For proper UI responsiveness, use start_deployment_async instead.
    """
    return deploy_reasoning_engine(config)


def test_deployed_agent_via_endpoint(deployment_result: dict, test_query: str) -> str:
    """Test the deployed agent via its actual endpoint."""
    config_env = get_project_config()
    
    try:
        if deployment_result.get("deployment_type") == "reasoning_engine":
            remote_agent = st.session_state.get("deployed_remote_agent")
            if remote_agent:
                try:
                    response = remote_agent.query(input=test_query)
                    if isinstance(response, dict):
                        return response.get("output", str(response))
                    return str(response)
                except Exception as e:
                    st.warning(f"Reasoning Engine query failed: {e}. Using fallback...")
            
            resource_name = deployment_result.get("resource_name")
            if resource_name:
                try:
                    engine = reasoning_engines.ReasoningEngine(resource_name)
                    response = engine.query(input=test_query)
                    if isinstance(response, dict):
                        return response.get("output", str(response))
                    return str(response)
                except Exception as e:
                    st.warning(f"Reasoning Engine lookup failed: {e}. Using API fallback...")
        
        config = deployment_result.get("config", {})
        endpoint_url = deployment_result.get("endpoint_url")
        access_token = get_access_token()
        
        if not access_token:
            st.warning("Could not obtain access token. Using local model fallback...")
            return test_deployed_agent_local(deployment_result, test_query)
        
        if not endpoint_url:
            st.warning("No endpoint URL available. Using local model fallback...")
            return test_deployed_agent_local(deployment_result, test_query)
        
        system_instruction = deployment_result.get("system_instruction") or st.session_state.get("agent_system_instruction", "")
        
        if not system_instruction:
            system_instruction = f"""You are an AI agent with the following configuration:

Name: {config.get('agent_name', 'Assistant')}
Type: {config.get('agent_type', 'conversational')}
Description: {config.get('description', 'A helpful AI assistant')}
Personality: {config.get('personality', 'Helpful and professional')}

Instructions:
{config.get('instructions', 'Be helpful and informative.')}

Respond to the user's query while staying in character."""

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": test_query}]
                }
            ],
            "systemInstruction": {
                "parts": [{"text": system_instruction}]
            },
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 2048,
            }
        }
        
        response = requests.post(endpoint_url, headers=headers, json=payload, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            candidates = result.get("candidates", [])
            if candidates:
                content = candidates[0].get("content", {})
                parts = content.get("parts", [])
                if parts:
                    return parts[0].get("text", "No response text")
            return "No response generated"
        else:
            error_detail = response.text[:500] if response.text else "Unknown error"
            st.warning(f"API returned status {response.status_code}. Using local model fallback...")
            return test_deployed_agent_local(deployment_result, test_query)
        
    except Exception as e:
        st.warning(f"Endpoint test failed: {str(e)}. Using local model fallback...")
        return test_deployed_agent_local(deployment_result, test_query)


def test_deployed_agent_local(deployment_result: dict, test_query: str) -> str:
    """Test using local Gemini model with agent's system instruction."""
    try:
        config = deployment_result.get("config", {})
        system_instruction = deployment_result.get("system_instruction") or st.session_state.get("agent_system_instruction", "")
        
        if not system_instruction:
            system_instruction = f"""You are an AI agent with the following configuration:

Name: {config.get('agent_name', 'Assistant')}
Type: {config.get('agent_type', 'conversational')}
Description: {config.get('description', 'A helpful AI assistant')}
Personality: {config.get('personality', 'Helpful and professional')}

Instructions:
{config.get('instructions', 'Be helpful and informative.')}

Respond to the user's query while staying in character."""
        
        model = GenerativeModel(
            "gemini-2.0-flash-exp",
            system_instruction=system_instruction
        )
        
        response = model.generate_content(test_query)
        return response.text
        
    except Exception as e:
        return f"Error testing agent: {str(e)}"


def main():
    st.set_page_config(
        page_title="Vertex AI Agent Builder",
        page_icon="🤖",
        layout="wide"
    )
    
    st.title("🤖 Vertex AI Agent Builder")
    st.markdown("Create and deploy AI agents on Vertex AI from natural language descriptions.")
    
    if "agent_config" not in st.session_state:
        st.session_state.agent_config = None
    if "deployment_result" not in st.session_state:
        st.session_state.deployment_result = None
    if "initialized" not in st.session_state:
        st.session_state.initialized = False
    
    config = get_project_config()
    
    with st.sidebar:
        st.header("⚙️ Configuration")
        
        st.subheader("Project Settings")
        st.text_input(
            "Project ID",
            value=config["project_id"],
            key="project_id_input",
            help="Set via VERTEX_AI_PROJECT_ID environment variable"
        )
        st.text_input(
            "Location",
            value=config["location"],
            key="location_input",
            help="Set via VERTEX_AI_LOCATION environment variable"
        )
        
        st.info(f"""
        **Active Project:** {config["project_id"]}
        **Location:** {config["location"]}
        **Model:** gemini-2.0-flash-exp
        """)
        
        st.markdown("---")
        st.header("📝 Sample Prompts")
        st.markdown("Click to use a sample prompt:")
        
        for i, prompt in enumerate(SAMPLE_PROMPTS):
            if st.button(f"Example {i+1}", key=f"sample_{i}", use_container_width=True):
                st.session_state.sample_prompt = prompt
    
    credentials_json = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    if not credentials_json:
        st.warning("⚠️ Google Cloud credentials not configured. Please add your service account JSON to the GOOGLE_APPLICATION_CREDENTIALS_JSON secret.")
        
        with st.expander("How to set up credentials"):
            st.markdown(f"""
            1. Go to [Google Cloud Console](https://console.cloud.google.com)
            2. Select project: **{config["project_id"]}**
            3. Navigate to **IAM & Admin** → **Service Accounts**
            4. Create a service account or use an existing one
            5. Grant the following roles:
               - Vertex AI User
               - Vertex AI Service Agent
               - AI Platform Admin
            6. Create a JSON key for the service account
            7. Copy the entire JSON content and add it as a Replit Secret named `GOOGLE_APPLICATION_CREDENTIALS_JSON`
            
            **Optional environment variables:**
            - `VERTEX_AI_PROJECT_ID`: Override the default project ID
            - `VERTEX_AI_LOCATION`: Override the default location (default: us-central1)
            """)
        return
    
    if not st.session_state.initialized:
        if init_vertex_ai():
            st.session_state.initialized = True
        else:
            st.error("Failed to initialize Vertex AI. Please check your credentials.")
            return
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.header("1. Describe Your Agent")
        
        default_prompt = st.session_state.get("sample_prompt", "")
        
        user_request = st.text_area(
            "Enter your agent requirements:",
            value=default_prompt,
            height=150,
            placeholder="Describe what kind of agent you want to create...\n\nExample: Create a customer support agent that can check order status and answer product questions. Make it helpful and professional.",
            key="user_request"
        )
        
        if st.button("🔍 Generate Configuration", type="primary", use_container_width=True):
            if user_request.strip():
                with st.spinner("Parsing requirements with Gemini 2.0..."):
                    parsed_config = parse_agent_requirements(user_request)
                    if parsed_config:
                        st.session_state.agent_config = parsed_config
                        st.session_state.deployment_result = None
                        st.success("Configuration generated successfully!")
            else:
                st.warning("Please enter your agent requirements first.")
    
    with col2:
        st.header("2. Review & Edit Configuration")
        
        if st.session_state.agent_config:
            edited_config = st.text_area(
                "Edit the configuration (JSON):",
                value=json.dumps(st.session_state.agent_config, indent=2),
                height=400,
                key="config_editor"
            )
            
            try:
                st.session_state.agent_config = json.loads(edited_config)
            except json.JSONDecodeError:
                st.error("Invalid JSON. Please fix the syntax.")
        else:
            st.info("Generate a configuration first to see it here.")
    
    st.markdown("---")
    
    if st.session_state.agent_config:
        st.header("3. Deploy Agent")
        
        if is_deployment_running():
            elapsed = get_deployment_elapsed_time()
            minutes = int(elapsed // 60)
            seconds = int(elapsed % 60)
            
            st.info(f"⏳ Deployment in progress... ({minutes}m {seconds}s elapsed)")
            
            with st.status("Deploying to Vertex AI Agent Engine...", expanded=True) as status:
                st.write("Building agent in Google Cloud...")
                st.write("This typically takes 5-10 minutes.")
                st.write(f"Elapsed: {minutes} minutes {seconds} seconds")
                
                if elapsed > 600:
                    st.warning("Deployment is taking longer than expected. Please wait...")
            
            result = check_deployment_status()
            if result:
                st.session_state.deployment_result = result
                st.rerun()
            else:
                time.sleep(3)
                st.rerun()
        
        col_deploy, col_status = st.columns([1, 2])
        
        with col_deploy:
            deploy_disabled = is_deployment_running()
            if st.button("🚀 Create & Deploy Agent", type="primary", use_container_width=True, disabled=deploy_disabled):
                start_deployment_async(st.session_state.agent_config)
                st.rerun()
        
        with col_status:
            if st.session_state.deployment_result:
                result = st.session_state.deployment_result
                
                if result["status"] == "deployed":
                    st.success("✅ Agent deployed successfully!")
                    
                    st.markdown("### Deployment Details")
                    
                    st.markdown(f"**Display Name:** {result.get('display_name', 'N/A')}")
                    st.markdown(f"**Description:** {result.get('description', 'N/A')}")
                    st.markdown(f"**Status:** `{result['status']}`")
                    
                    deployment_type = result.get('deployment_type', 'unknown')
                    endpoint_validated = result.get('endpoint_validated', False)
                    
                    if deployment_type == 'reasoning_engine':
                        st.success("🔷 Agent deployed via Vertex AI Reasoning Engine (dedicated resource)")
                        if endpoint_validated:
                            st.success("✓ Endpoint validated and responding")
                    elif deployment_type == 'gemini_configured':
                        st.info("🔹 Agent configured with Gemini API + System Instruction")
                        if result.get('note'):
                            st.caption(result['note'])
                        if endpoint_validated:
                            st.success("✓ Endpoint validated and responding")
                    
                    st.markdown("### API Endpoint")
                    st.code(result.get("endpoint_url", "N/A"), language="text")
                    
                    if result.get("resource_name"):
                        st.markdown("### Resource Name")
                        st.code(result["resource_name"], language="text")
                    
                    if result.get("agent_id"):
                        st.markdown("### Agent ID")
                        st.code(result["agent_id"], language="text")
                    
                    if result.get("initialization_response"):
                        with st.expander("View Initialization Response"):
                            st.write(result["initialization_response"])
                    
                    if result.get("agent_code"):
                        with st.expander("View Generated Agent Code"):
                            st.code(result["agent_code"], language="python")
                    
                    with st.expander("View API Usage Example"):
                        config = get_project_config()
                        endpoint = result.get("endpoint_url", "YOUR_ENDPOINT")
                        system_inst = result.get("system_instruction", "")[:200] + "..." if result.get("system_instruction") else ""
                        
                        curl_example = f'''curl -X POST \\
  "{endpoint}" \\
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \\
  -H "Content-Type: application/json" \\
  -d '{{
    "contents": [{{
      "role": "user",
      "parts": [{{"text": "YOUR_QUERY_HERE"}}]
    }}],
    "systemInstruction": {{
      "parts": [{{"text": "YOUR_AGENT_SYSTEM_INSTRUCTION"}}]
    }},
    "generationConfig": {{
      "temperature": 0.7,
      "maxOutputTokens": 2048
    }}
  }}'
'''
                        st.code(curl_example, language="bash")
                    
                elif result["status"] == "error":
                    st.error(f"❌ Deployment failed: {result.get('error', 'Unknown error')}")
    
    if st.session_state.deployment_result and st.session_state.deployment_result.get("status") == "deployed":
        st.markdown("---")
        st.header("4. Test Your Agent")
        
        deployment_type = st.session_state.deployment_result.get("deployment_type", "unknown")
        st.caption(f"Testing via: {deployment_type} endpoint")
        
        test_query = st.text_input(
            "Enter a test query:",
            placeholder="Ask your agent a question...",
            key="test_query"
        )
        
        if st.button("💬 Send Query", use_container_width=True):
            if test_query.strip():
                with st.spinner("Getting response from deployed agent..."):
                    response = test_deployed_agent_via_endpoint(
                        st.session_state.deployment_result,
                        test_query
                    )
                    
                    st.markdown("### Agent Response")
                    st.write(response)
            else:
                st.warning("Please enter a test query.")
    
    st.markdown("---")
    config = get_project_config()
    st.markdown(f"""
    <div style="text-align: center; color: #666; font-size: 0.9em;">
        Built with Streamlit and Vertex AI | Project: {config["project_id"]} | Location: {config["location"]}
    </div>
    """, unsafe_allow_html=True)


if __name__ == "__main__":
    main()
