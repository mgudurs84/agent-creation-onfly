from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

try:
    from backend.services.gemini_parser import parse_agent_requirements
    from backend.services.vertex_ai import (
        start_deployment,
        get_deployment_status,
        test_agent,
        DeploymentStatus
    )
    from backend.config import SAMPLE_PROMPTS, get_project_config
    from backend.services.auth import has_credentials
except ImportError:
    from services.gemini_parser import parse_agent_requirements
    from services.vertex_ai import (
        start_deployment,
        get_deployment_status,
        test_agent,
        DeploymentStatus
    )
    from config import SAMPLE_PROMPTS, get_project_config
    from services.auth import has_credentials

router = APIRouter(prefix="/api", tags=["agents"])

class ParseRequest(BaseModel):
    user_request: str

class AgentConfig(BaseModel):
    agent_name: str
    agent_type: str
    description: str
    capabilities: List[str]
    tools: List[str]
    personality: str
    instructions: str

class DeployRequest(BaseModel):
    config: AgentConfig

class TestRequest(BaseModel):
    deployment_id: str
    query: str

class ParseResponse(BaseModel):
    config: dict

class DeployResponse(BaseModel):
    deployment_id: str

class StatusResponse(BaseModel):
    id: str
    status: str
    elapsed_seconds: float
    result: Optional[dict] = None
    error: Optional[str] = None

class TestResponse(BaseModel):
    response: str

class HealthResponse(BaseModel):
    status: str
    has_credentials: bool
    project_id: str
    location: str

class SamplePromptsResponse(BaseModel):
    prompts: List[str]

@router.get("/health", response_model=HealthResponse)
async def health_check():
    config = get_project_config()
    return HealthResponse(
        status="ok",
        has_credentials=has_credentials(),
        project_id=config["project_id"],
        location=config["location"]
    )

@router.get("/sample-prompts", response_model=SamplePromptsResponse)
async def get_sample_prompts():
    return SamplePromptsResponse(prompts=SAMPLE_PROMPTS)

@router.post("/parse", response_model=ParseResponse)
async def parse_requirements(request: ParseRequest):
    if not has_credentials():
        raise HTTPException(status_code=401, detail="Google Cloud credentials not configured")
    
    try:
        config = parse_agent_requirements(request.user_request)
        return ParseResponse(config=config)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/deploy", response_model=DeployResponse)
async def deploy_agent(request: DeployRequest):
    if not has_credentials():
        raise HTTPException(status_code=401, detail="Google Cloud credentials not configured")
    
    try:
        deployment_id = start_deployment(request.config.model_dump())
        return DeployResponse(deployment_id=deployment_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{deployment_id}", response_model=StatusResponse)
async def get_status(deployment_id: str):
    status = get_deployment_status(deployment_id)
    
    if status is None:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    return StatusResponse(**status)

@router.post("/test", response_model=TestResponse)
async def test_deployed_agent(request: TestRequest):
    if not has_credentials():
        raise HTTPException(status_code=401, detail="Google Cloud credentials not configured")
    
    try:
        response = test_agent(request.deployment_id, request.query)
        return TestResponse(response=response)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
