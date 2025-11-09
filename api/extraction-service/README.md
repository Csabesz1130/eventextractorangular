# Extraction microservice (FastAPI)

## Requirements

- Python 3.11
- An OpenAI API key (set `OPENAI_API_KEY` environment variable).
- (Optional) Docker

## Local run

1. Create venv:

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
export OPENAI_API_KEY="sk-..."  # On Windows: set OPENAI_API_KEY=sk-...
uvicorn main:app --reload --port 8080
```

2. Test:

```bash
curl -X POST "http://localhost:8080/extract" -H "Content-Type: application/json" -d '{
  "text": "Hi Tom, let us meet next Friday at 3pm at Central Cafe. I will bring slides. - Anna",
  "source": "gmail",
  "timezone": "Europe/Budapest",
  "locale": "en"
}'
```

## Docker

```bash
docker build -t event-extractor .
docker run -e OPENAI_API_KEY="sk-..." -p 8080:8080 event-extractor
```

Note: This is an MVP scaffold. Replace the OpenAI model string and the approval logic with your calendar connectors in production.

