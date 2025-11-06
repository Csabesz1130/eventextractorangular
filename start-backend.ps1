# Start Backend Extraction Service
cd api/extraction-service
.venv\Scripts\activate
$env:OPENAI_API_KEY="***REMOVED***"
python -m uvicorn main:app --reload --port 8080
