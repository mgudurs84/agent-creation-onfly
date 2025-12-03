from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import agents

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
