import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

print("=" * 50)
print("STARTUP: Checking environment variables...")
print(f"GOOGLE_APPLICATION_CREDENTIALS: {os.environ.get('GOOGLE_APPLICATION_CREDENTIALS', 'NOT SET')}")
print(f"GOOGLE_APPLICATION_CREDENTIALS_JSON: {'SET' if os.environ.get('GOOGLE_APPLICATION_CREDENTIALS_JSON') else 'NOT SET'}")
print(f"VERTEX_AI_PROJECT_ID: {os.environ.get('VERTEX_AI_PROJECT_ID', 'NOT SET')}")

creds_file = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
if creds_file:
    print(f"Checking if file exists: {os.path.exists(creds_file)}")
print("=" * 50)

try:
    from backend.routers import agents
except ImportError:
    from routers import agents

app = FastAPI(
    title="Vertex AI Agent Builder API",
    description="API for creating and deploying AI agents on Vertex AI",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agents.router)

@app.get("/")
async def root():
    return {
        "message": "Vertex AI Agent Builder API",
        "docs": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
