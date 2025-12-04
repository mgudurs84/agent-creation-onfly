import os
import json
import tempfile
from google.oauth2 import service_account
from google.auth.transport.requests import Request as AuthRequest
import google.auth

try:
    from backend.config import VERTEX_AI_SCOPES
except ImportError:
    from config import VERTEX_AI_SCOPES

_cached_credentials = None
_cached_credentials_path = None

def get_credentials():
    global _cached_credentials, _cached_credentials_path
    
    credentials_json = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    credentials_file = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    
    if credentials_json:
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
    
    elif credentials_file and os.path.exists(credentials_file):
        credentials = service_account.Credentials.from_service_account_file(
            credentials_file,
            scopes=VERTEX_AI_SCOPES
        )
        return credentials
    
    else:
        try:
            credentials, project = google.auth.default(scopes=VERTEX_AI_SCOPES)
            return credentials
        except Exception:
            return None

def get_access_token():
    credentials_json = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    credentials_file = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    
    try:
        if credentials_json:
            credentials_info = json.loads(credentials_json)
            credentials = service_account.Credentials.from_service_account_info(
                credentials_info,
                scopes=["https://www.googleapis.com/auth/cloud-platform"]
            )
        elif credentials_file and os.path.exists(credentials_file):
            credentials = service_account.Credentials.from_service_account_file(
                credentials_file,
                scopes=["https://www.googleapis.com/auth/cloud-platform"]
            )
        else:
            credentials, project = google.auth.default(
                scopes=["https://www.googleapis.com/auth/cloud-platform"]
            )
        
        auth_req = AuthRequest()
        credentials.refresh(auth_req)
        
        return credentials.token if credentials.token else None
    except Exception as e:
        print(f"Failed to get access token: {e}")
        return None

def has_credentials():
    if os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON"):
        print("[AUTH] Found GOOGLE_APPLICATION_CREDENTIALS_JSON")
        return True
    
    credentials_file = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if credentials_file:
        print(f"[AUTH] GOOGLE_APPLICATION_CREDENTIALS set to: {credentials_file}")
        if os.path.exists(credentials_file):
            print(f"[AUTH] File exists: True")
            return True
        else:
            print(f"[AUTH] File exists: False - file not found at path")
    else:
        print("[AUTH] GOOGLE_APPLICATION_CREDENTIALS not set")
    
    try:
        credentials, project = google.auth.default()
        print(f"[AUTH] Using default credentials for project: {project}")
        return True
    except Exception as e:
        print(f"[AUTH] No default credentials: {e}")
        return False
