set VERTEX_AI_PROJECT_ID=vertex-ai-demo-468112

set VERTEX_AI_LOCATION=us-central1



set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\your-service-account.json
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
