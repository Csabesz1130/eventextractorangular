# Testing Guide

This guide will help you test all the implemented features.

## Prerequisites

1. **Environment Variables**: Create a `.env` file in the root directory:
```env
# Database
POSTGRES_USER=eventflow
POSTGRES_PASSWORD=eventflow
POSTGRES_DB=eventflow
POSTGRES_PORT=5433
DATABASE_URL=postgresql://eventflow:eventflow@localhost:5433/eventflow?schema=public

# OpenAI
OPENAI_API_KEY=sk-your-key-here

# Google OAuth (optional for Gmail testing)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8911/auth/google/callback

# API URLs
EXTRACTION_API_URL=http://localhost:8080
API_PORT=8911
WEB_PORT=4200
```

2. **Dependencies**: Install all dependencies:
```bash
# Root dependencies
yarn install

# API dependencies
cd api
yarn install

# Web dependencies
cd ../web
yarn install
```

## Starting Services

### Option 1: Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Option 2: Manual Start

**Terminal 1 - PostgreSQL:**
```bash
docker run -d \
  --name eventflow-postgres \
  -e POSTGRES_USER=eventflow \
  -e POSTGRES_PASSWORD=eventflow \
  -e POSTGRES_DB=eventflow \
  -p 5433:5432 \
  postgres:15-alpine
```

**Terminal 2 - Extraction Service:**
```bash
cd api/extraction-service
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
export OPENAI_API_KEY=sk-your-key-here
uvicorn main:app --reload --port 8080
```

**Terminal 3 - RedwoodJS API:**
```bash
cd api
yarn install
yarn prisma migrate dev
yarn prisma generate
yarn rw dev api
```

**Terminal 4 - Angular Frontend:**
```bash
cd web
yarn install
yarn start
```

## Testing Features

### 1. Quick Add Event Extraction

1. Open `http://localhost:4200`
2. Click "Quick Add" button (or press `Cmd/Ctrl+K`)
3. Paste test text:
   ```
   Hi Tom, let's meet next Friday at 3pm at Central Cafe. I'll bring the slides. - Anna
   ```
4. Click "Extract"
5. Verify the event appears in the Inbox with:
   - Title extracted
   - Date/time parsed correctly
   - Location detected
   - Confidence score displayed

### 2. Hungarian Locale Support

1. Use Quick Add with Hungarian text:
   ```
   Kedves Hallgatók! A vizsga 2025. november 10-én hétfőn 21.00 órakor lesz.
   ```
2. Verify:
   - Date parsed correctly (November 10, 2025, 9:00 PM)
   - Hungarian keywords recognized

### 3. Confidence Rules

Test with different email sources:

**High Confidence (Academic Domain):**
```
Subject: Exam Schedule - Pulmonológia
From: fabian.edit@unideb.hu

The exam will be on November 10, 2025 at 9:00 PM.
```

**Medium Confidence (Generic Email):**
```
Subject: Meeting
From: john@example.com

Let's meet tomorrow at 2pm.
```

### 4. Quick Approve (Click-to-Approve)

1. In the Inbox, click anywhere on an event card
2. Verify:
   - Card animates (pulse effect)
   - Event is approved immediately
   - Undo notification appears

### 5. Keyboard Shortcuts

- `Cmd/Ctrl+K`: Open Quick Add
- `a` (when card focused): Approve event
- `s` (when card focused): Snooze event

### 6. Batch Operations

1. Click "Select" button in Inbox
2. Select multiple events using checkboxes
3. Click "Approve All" or "Snooze All"
4. Verify all selected events are processed

### 7. Auto-Approve Settings

1. Navigate to Settings page
2. Enable "Auto-Approve"
3. Set confidence threshold (e.g., 70%)
4. Save settings
5. Extract a high-confidence event (confidence > 70%)
6. Verify it's automatically approved (check Calendar page)

### 8. Gmail Integration (Requires OAuth Setup)

1. Navigate to Connectors page
2. Click "Connect Google"
3. Complete OAuth flow
4. Click "Poll once" to fetch emails
5. Verify events are extracted from Gmail messages

### 9. Calendar Sync

1. Approve an event
2. Verify:
   - Event appears in Calendar view
   - If Google Calendar connected, event syncs to Google Calendar
   - If Apple Calendar selected, ICS file is emailed

### 10. WebSocket Real-Time Updates

1. Open browser console
2. Send a test event via API:
```bash
curl -X POST http://localhost:8911/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { extractEvent(input: { text: \"Test event tomorrow at 2pm\", source: \"test\" }) { id title } }"
  }'
```
3. Verify notification appears in UI

## Test Data

### English Test Cases

```
Meeting tomorrow at 2pm in Conference Room A
```

```
Dentist appointment on November 13, 2025 at 2:30 PM at Smile Dental Clinic
```

```
Team standup every Monday at 9:00 AM
```

### Hungarian Test Cases

```
Vizsga 2025. november 10-én hétfőn 21.00 órakor
```

```
Találkozó holnap délután 2 órakor a Főtéren
```

### Mixed Language

```
Dentist Appointment - Fogorvos időpont
Wednesday, November 13, 2025 at 2:30 PM
Smile Dental Clinic, Main Street 10
```

## Troubleshooting

### Extraction Service Not Responding
- Check if service is running: `curl http://localhost:8080/suggestions_stub`
- Check logs for OpenAI API key errors
- Verify `OPENAI_API_KEY` is set correctly

### Database Connection Issues
- Verify PostgreSQL is running: `docker ps`
- Check `DATABASE_URL` in `.env`
- Run migrations: `cd api && yarn prisma migrate dev`

### Frontend Not Loading
- Check if Angular dev server is running: `http://localhost:4200`
- Check browser console for errors
- Verify API is accessible: `http://localhost:8911/graphql`

### GraphQL Errors
- Check API logs for errors
- Verify Prisma client is generated: `cd api && yarn prisma generate`
- Check database schema matches migrations

## Next Steps

1. Set up Google OAuth for Gmail integration
2. Configure Pub/Sub for Gmail push notifications
3. Set up email service (SendGrid/Mailgun) for production
4. Configure WebSocket server for real-time updates
5. Set up cron job for auto-approve service

