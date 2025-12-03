import os
import json
import tempfile
from google.oauth2 import service_account
from google.auth.transport.requests import Request as AuthRequest
from backend.config import VERTEX_AI_SCOPES

_cached_credentials = None
_cached_credentials_path = None

def get_credentials():
    global _cached_credentials, _cached_credentials_path
    
    credentials_json = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    
    if not credentials_json:
        return None
    
    if _cached_credentials_path is None:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            f.write(credentials_json)
            _cached_credentials_path = f.name
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = _cached_credentials_path
    
    credentials_info = json.loads(credentials_json)
    credentials = service_account.Credentials.from_service_account_info(
        credentials_info,
        scopes=VERTEX_AI_SCOPES
    )
    
    return credentials

def get_access_token():
    credentials_json = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    
    if not credentials_json:
        return None
    
    try:
        credentials_info = json.loads(credentials_json)
        credentials = service_account.Credentials.from_service_account_info(
            credentials_info,
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        
        auth_req = AuthRequest()
        credentials.refresh(auth_req)
        
        return credentials.token if credentials.token else None
    except Exception as e:
        print(f"Failed to get access token: {e}")
        return None

def has_credentials():
    return os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON") is not None
