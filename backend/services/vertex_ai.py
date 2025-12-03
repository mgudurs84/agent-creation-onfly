import time
import uuid
import requests
import vertexai
from vertexai.preview import reasoning_engines
from vertexai.generative_models import GenerativeModel
from backend.config import get_project_config, STAGING_BUCKET
from backend.services.auth import get_credentials, get_access_token

deployments = {}

class DeploymentStatus:
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ERROR = "error"

def create_system_message(config: dict) -> str:
    return f"""{config["instructions"]}

Your personality: {config["personality"]}
Agent type: {config["agent_type"]}
Description: {config["description"]}

You are a helpful AI assistant. Answer user questions thoughtfully and thoroughly."""

def create_agent_code(config: dict) -> str:
    capabilities_str = ", ".join([f'"{cap}"' for cap in config.get("capabilities", [])])
    tools_str = ", ".join([f'"{tool}"' for tool in config.get("tools", [])])
    
    return f'''
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

def start_deployment(config: dict) -> str:
    deployment_id = str(uuid.uuid4())
    
    deployments[deployment_id] = {
        "id": deployment_id,
        "status": DeploymentStatus.PENDING,
        "config": config,
        "start_time": time.time(),
        "result": None,
        "error": None,
    }
    
    import threading
    thread = threading.Thread(
        target=_deploy_worker,
        args=(deployment_id, config),
        daemon=True
    )
    thread.start()
    
    return deployment_id

def _deploy_worker(deployment_id: str, config: dict):
    try:
        deployments[deployment_id]["status"] = DeploymentStatus.IN_PROGRESS
        
        project_config = get_project_config()
        project_id = project_config["project_id"]
        location = project_config["location"]
        
        print(f"[DEPLOY-{deployment_id[:8]}] Starting deployment for: {config.get('agent_name')}")
        
        credentials = get_credentials()
        if credentials:
            vertexai.init(
                project=project_id,
                location=location,
                credentials=credentials,
                staging_bucket=STAGING_BUCKET
            )
        else:
            vertexai.init(
                project=project_id,
                location=location,
                staging_bucket=STAGING_BUCKET
            )
        
        system_message = create_system_message(config)
        agent_code = create_agent_code(config)
        
        print(f"[DEPLOY-{deployment_id[:8]}] Creating LangChain agent...")
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
        
        print(f"[DEPLOY-{deployment_id[:8]}] Submitting to Agent Engine...")
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
        
        print(f"[DEPLOY-{deployment_id[:8]}] Deployment complete: {remote_agent.resource_name}")
        
        resource_name = remote_agent.resource_name
        base_url = f"https://{location}-aiplatform.googleapis.com/v1beta1"
        endpoint_url = f"{base_url}/{resource_name}:query"
        
        endpoint_validated = False
        try:
            test_response = remote_agent.query(input="Hello, are you ready?")
            endpoint_validated = True
        except Exception as e:
            print(f"[DEPLOY-{deployment_id[:8]}] Endpoint warmup needed: {e}")
        
        deployments[deployment_id]["status"] = DeploymentStatus.COMPLETED
        deployments[deployment_id]["result"] = {
            "resource_name": resource_name,
            "endpoint_url": endpoint_url,
            "display_name": config["agent_name"],
            "description": config["description"],
            "agent_code": agent_code,
            "deployment_type": "reasoning_engine",
            "config": config,
            "endpoint_validated": endpoint_validated,
            "system_message": system_message,
        }
        
    except Exception as e:
        print(f"[DEPLOY-{deployment_id[:8]}] Deployment failed: {e}")
        deployments[deployment_id]["status"] = DeploymentStatus.ERROR
        deployments[deployment_id]["error"] = str(e)

def get_deployment_status(deployment_id: str) -> dict:
    if deployment_id not in deployments:
        return None
    
    deployment = deployments[deployment_id]
    elapsed = time.time() - deployment["start_time"]
    
    return {
        "id": deployment_id,
        "status": deployment["status"],
        "elapsed_seconds": elapsed,
        "result": deployment["result"],
        "error": deployment["error"],
    }

def test_agent(deployment_id: str, query: str) -> str:
    if deployment_id not in deployments:
        raise ValueError("Deployment not found")
    
    deployment = deployments[deployment_id]
    
    if deployment["status"] != DeploymentStatus.COMPLETED:
        raise ValueError("Deployment not complete")
    
    result = deployment["result"]
    config = result["config"]
    
    resource_name = result.get("resource_name")
    if resource_name:
        try:
            engine = reasoning_engines.ReasoningEngine(resource_name)
            response = engine.query(input=query)
            if isinstance(response, dict):
                return response.get("output", str(response))
            return str(response)
        except Exception as e:
            print(f"ReasoningEngine query failed: {e}, using fallback")
    
    system_instruction = result.get("system_message", "")
    access_token = get_access_token()
    endpoint_url = result.get("endpoint_url", "").replace(":query", ":generateContent").replace("v1beta1", "v1")
    
    if access_token and endpoint_url:
        try:
            project_config = get_project_config()
            location = project_config["location"]
            project_id = project_config["project_id"]
            
            api_endpoint = f"https://{location}-aiplatform.googleapis.com/v1/projects/{project_id}/locations/{location}/publishers/google/models/gemini-2.0-flash-exp:generateContent"
            
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            }
            
            payload = {
                "contents": [{"role": "user", "parts": [{"text": query}]}],
                "systemInstruction": {"parts": [{"text": system_instruction}]},
                "generationConfig": {"temperature": 0.7, "maxOutputTokens": 2048}
            }
            
            response = requests.post(api_endpoint, headers=headers, json=payload, timeout=60)
            
            if response.status_code == 200:
                data = response.json()
                candidates = data.get("candidates", [])
                if candidates:
                    content = candidates[0].get("content", {})
                    parts = content.get("parts", [])
                    if parts:
                        return parts[0].get("text", "No response")
        except Exception as e:
            print(f"API fallback failed: {e}")
    
    try:
        model = GenerativeModel(
            "gemini-2.0-flash-exp",
            system_instruction=system_instruction
        )
        response = model.generate_content(query)
        return response.text
    except Exception as e:
        return f"Error testing agent: {str(e)}"
