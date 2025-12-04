cd C:\AgentForge\AgentForge-1\AgentForge-1
set GOOGLE_APPLICATION_CREDENTIALS=C:\AgentForge\AgentForge-1\AgentForge-1\vertex-ai-demo-468112-be60a1e31942.json
set VERTEX_AI_PROJECT_ID=vertex-ai-demo-468112
set VERTEX_AI_LOCATION=us-central1
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

Terminal 2 - Frontend (port 3000):

cd C:\AgentForge\AgentForge-1\AgentForge-1\frontend
npm run dev

pip install fastapi uvicorn "google-cloud-aiplatform[langchain,reasoningengine]" google-auth langchain langchain-google-vertexai cloudpickle pydantic
