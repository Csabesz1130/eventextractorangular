# Setup Guide

## Environment Variables

Create a `.env` file in the root directory with the following variables (see `.env.example` if it exists, or use this template):

```env
# General
NODE_ENV=production
APP_HOST=0.0.0.0
APP_PORT=8080

# Extraction service
OPENAI_API_KEY=sk-xxxxx
EXTRACTOR_DATABASE_URL=sqlite:///./tokens.db
EXTRACT_CONFIDENCE_THRESHOLD=0.6

# Google
GOOGLE_CLIENT_SECRETS_FILE=./api/extraction-service/client_secrets.json
GOOGLE_REDIRECT_URI=http://localhost:8080/auth/google/callback

# Docker / deploy
WEB_PORT=4200
EXTRACTION_PORT=8080
```

## Quick Start

### Backend (Extraction Service)

1. Navigate to `api/extraction-service/`
2. Create virtual environment: `python -m venv .venv`
3. Activate: `source .venv/bin/activate` (Windows: `.venv\Scripts\activate`)
4. Install dependencies: `pip install -r requirements.txt`
5. Download spaCy model: `python -m spacy download en_core_web_sm`
6. Set OpenAI API key: `export OPENAI_API_KEY="sk-..."`
7. Run: `uvicorn main:app --reload --port 8080`

### Frontend (Angular)

1. Navigate to `web/`
2. Install dependencies: `npm install`
3. Run: `ng serve` (or `npm start`)

### Docker Compose

1. Create `.env` file in root (see above)
2. Run: `docker-compose up`

This will start:
- Extraction service on port 8080
- Web (Nginx) on port 3000
- Duckling (optional) on port 8000

## Notes

- The Angular app expects the extraction service at `http://localhost:8080`
- CORS is configured for `http://localhost:4200` (Angular dev server)
- Update `web/Dockerfile` dist path to match your `angular.json` outputPath

